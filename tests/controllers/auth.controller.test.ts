import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { AuthController } from "../../src/controllers/auth-controller";
import { InvalidCredentialsError } from "../../src/services/auth-service";
import { RefreshSessionService } from "../../src/services/refresh-session.service";

type AuthServiceLike = ConstructorParameters<typeof AuthController>[0];
type RefreshSessionServiceLike = Pick<
  RefreshSessionService,
  "createSession" | "rotateSession" | "revokeSession"
>;

const createApp = (controller: AuthController) => {
  const app = new Hono();
  app.post("/login", (c) => controller.loginWithPassword(c));
  return app;
};

describe("AuthController.loginWithPassword", () => {
  const refreshServiceMock: RefreshSessionServiceLike = {
    createSession: async () => ({ plainToken: "refresh_token_value" }),
    rotateSession: async () => null,
    revokeSession: async () => {},
  };

  it("returns the app JWT response shape on success", async () => {
    const authServiceMock: AuthServiceLike = {
      loginWithPassword: async () => ({
        accessToken: "token_123",
        expiresIn: 900,
        workosUserId: "user_123",
        organizationId: "org_123",
      }),
      issueAccessToken: async () => ({
        accessToken: "token_123",
        expiresIn: 900,
      }),
    };
    const controller = new AuthController(authServiceMock, refreshServiceMock);
    const app = createApp(controller);

    const response = await app.request("/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "bun-test",
        "x-forwarded-for": "203.0.113.10",
      },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password",
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      accessToken: "token_123",
      expiresIn: 900,
    });
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("vl_refresh=refresh_token_value");
    expect(cookie?.toLowerCase()).toContain("httponly");
  });

  it("returns a safe invalid-credentials response", async () => {
    const authServiceMock: AuthServiceLike = {
      loginWithPassword: async () => {
        throw new InvalidCredentialsError();
      },
      issueAccessToken: async () => ({ accessToken: "token_123", expiresIn: 900 }),
    };
    const controller = new AuthController(authServiceMock, refreshServiceMock);
    const app = createApp(controller);

    const response = await app.request("/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "user@example.com",
        password: "wrong-password",
      }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid credentials" });
  });

  it("returns a safe unavailable response for unexpected failures", async () => {
    const authServiceMock: AuthServiceLike = {
      loginWithPassword: async () => {
        throw new Error("upstream down");
      },
      issueAccessToken: async () => ({ accessToken: "token_123", expiresIn: 900 }),
    };
    const controller = new AuthController(authServiceMock, refreshServiceMock);
    const app = createApp(controller);

    const response = await app.request("/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password",
      }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Authentication unavailable" });
  });
});
