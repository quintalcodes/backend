import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { createAdminMiddleware } from "../../src/middleware/admin-middleware";

const TEST_ADMIN_API_KEY = "test-admin-api-key";
const originalAdminApiKey = Bun.env.ADMIN_API_KEY;

beforeAll(() => {
  Bun.env.ADMIN_API_KEY = TEST_ADMIN_API_KEY;
});

afterAll(() => {
  Bun.env.ADMIN_API_KEY = originalAdminApiKey;
});

const createAdminApp = ({
  getApiKey = () => TEST_ADMIN_API_KEY,
}: {
  getApiKey?: () => string;
} = {}) => {
  const app = new Hono();

  app.use("/admin/*", createAdminMiddleware({ getApiKey }));
  app.get("/admin/test", (c) => c.json({ ok: true }, 200));

  return app;
};

describe("admin middleware", () => {
  it("should reject a request without an api key", async () => {
    // Arrange
    const app = createAdminApp();

    // Act
    const response = await app.request("/admin/test");

    // Assert
    expect({
      status: response.status,
      body: await response.json(),
    }).toEqual({
      status: 401,
      body: { error: "Unauthorized" },
    });
  });

  it("should reject a request with an empty api key", async () => {
    // Arrange
    const app = createAdminApp();

    // Act
    const response = await app.request("/admin/test", {
      headers: { "x-api-key": "" },
    });

    // Assert
    expect({
      status: response.status,
      body: await response.json(),
    }).toEqual({
      status: 401,
      body: { error: "Unauthorized" },
    });
  });

  it("should reject a request with the wrong api key", async () => {
    // Arrange
    const app = createAdminApp();

    // Act
    const response = await app.request("/admin/test", {
      headers: { "x-api-key": "wrong-key" },
    });

    // Assert
    expect({
      status: response.status,
      body: await response.json(),
    }).toEqual({
      status: 401,
      body: { error: "Unauthorized" },
    });
  });

  it("should allow a request with a matching api key", async () => {
    // Arrange
    const app = createAdminApp();

    // Act
    const response = await app.request("/admin/test", {
      headers: { "x-api-key": TEST_ADMIN_API_KEY },
    });

    // Assert
    expect({
      status: response.status,
      body: await response.json(),
    }).toEqual({
      status: 200,
      body: { ok: true },
    });
  });

  it("should allow a request that matches the environment api key", async () => {
    // Arrange
    const app = new Hono();
    app.use("/admin/*", createAdminMiddleware());
    app.get("/admin/test", (c) => c.json({ ok: true }, 200));

    // Act
    const response = await app.request("/admin/test", {
      headers: { "x-api-key": TEST_ADMIN_API_KEY },
    });

    // Assert
    expect({
      status: response.status,
      body: await response.json(),
    }).toEqual({
      status: 200,
      body: { ok: true },
    });
  });
});
