import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { createAuthMiddleware } from "../../src/middleware/auth-middleware";
import { createTenantMiddleware } from "../../src/middleware/tenant-middleware";
import type { Variables } from "../../src/types/hono-env";

const TEST_SECRET = "test-secret-for-jwt-signing";
const TEST_ISSUER = "venuelog-backend-test";
const TEST_AUDIENCE = "venuelog-api-test";

const originalJwtSecret = Bun.env.JWT_SECRET;
const originalJwtIssuer = Bun.env.JWT_ISSUER;
const originalJwtAudience = Bun.env.JWT_AUDIENCE;

beforeAll(() => {
  Bun.env.JWT_SECRET = TEST_SECRET;
  Bun.env.JWT_ISSUER = TEST_ISSUER;
  Bun.env.JWT_AUDIENCE = TEST_AUDIENCE;
});

afterAll(() => {
  Bun.env.JWT_SECRET = originalJwtSecret;
  Bun.env.JWT_ISSUER = originalJwtIssuer;
  Bun.env.JWT_AUDIENCE = originalJwtAudience;
});

const fakeTenantPrisma = {} as PrismaClient;

const createToken = (payload: Record<string, unknown>) =>
  sign(
    {
      sub: "user_123",
      organizationId: "org_123",
      iss: TEST_ISSUER,
      aud: TEST_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 60,
      ...payload,
    },
    TEST_SECRET,
  );

const createProtectedApp = ({
  getTenantByWorkosOrgId = async () => ({ dbName: "tenant_a" }),
} = {}) => {
  const app = new Hono<{ Variables: Variables }>();

  app.use("/api/*", createAuthMiddleware());
  app.use(
    "/api/*",
    createTenantMiddleware({
      registryService: {
        getTenantByWorkosOrgId,
      },
      getTenantPrisma: () => fakeTenantPrisma,
    }),
  );

  app.get("/api/test", (c) => {
    return c.json(
      {
        userId: c.get("auth").userId,
        organizationId: c.get("auth").organizationId,
        hasTenantPrisma: Boolean(c.get("tenantPrisma")),
      },
      200,
    );
  });

  return app;
};

describe("protected route middleware", () => {
  it("rejects requests without a bearer token", async () => {
    const app = createProtectedApp();

    const response = await app.request("/api/test");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects tokens with an invalid signature", async () => {
    const app = createProtectedApp();
    const token = await sign(
      {
        sub: "user_123",
        organizationId: "org_123",
        iss: TEST_ISSUER,
        aud: TEST_AUDIENCE,
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      "wrong-secret",
    );

    const response = await app.request("/api/test", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects tokens that are missing required claims", async () => {
    const app = createProtectedApp();
    const token = await createToken({ organizationId: undefined });

    const response = await app.request("/api/test", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects tokens with the wrong issuer", async () => {
    const app = createProtectedApp();
    const token = await createToken({ iss: "other-issuer" });

    const response = await app.request("/api/test", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects tokens with the wrong audience", async () => {
    const app = createProtectedApp();
    const token = await createToken({ aud: "other-audience" });

    const response = await app.request("/api/test", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns forbidden when the tenant is unknown", async () => {
    const app = createProtectedApp({
      getTenantByWorkosOrgId: async () => {
        throw new Error("Tenant not found: org_123");
      },
    });
    const token = await createToken({});

    const response = await app.request("/api/test", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
  });

  it("accepts valid tokens and exposes auth context", async () => {
    const app = createProtectedApp();
    const token = await createToken({});

    const response = await app.request("/api/test", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      userId: "user_123",
      organizationId: "org_123",
      hasTenantPrisma: true,
    });
  });
});
