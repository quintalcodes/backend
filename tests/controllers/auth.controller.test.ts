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
  app.post("/auth/reset-password", (c) => controller.resetPassword(c));
  app.post("/auth/reset-password/confirm", (c) => controller.confirmResetPassword(c));
  return app;
};

const createAuthServiceMock = (
  overrides: Partial<AuthServiceLike> = {},
): AuthServiceLike => ({
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
  requestPasswordReset: async () => {},
  confirmPasswordReset: async () => {},
  ...overrides,
});

describe("AuthController.loginWithPassword", () => {
  const refreshServiceMock: RefreshSessionServiceLike = {
    createSession: async () => ({ plainToken: "refresh_token_value" }),
    rotateSession: async () => null,
    revokeSession: async () => {},
  };

  it("returns the app JWT response shape on success", async () => {
    const authServiceMock = createAuthServiceMock();
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
    const authServiceMock = createAuthServiceMock({
      loginWithPassword: async () => {
        throw new InvalidCredentialsError();
      },
    });
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
    const authServiceMock = createAuthServiceMock({
      loginWithPassword: async () => {
        throw new Error("upstream down");
      },
    });
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

describe("AuthController.resetPassword", () => {
  const refreshServiceMock: RefreshSessionServiceLike = {
    createSession: async () => ({ plainToken: "refresh_token_value" }),
    rotateSession: async () => null,
    revokeSession: async () => {},
  };

  it("requests a password reset and returns a generic success message", async () => {
    let requestedEmail: string | undefined;
    const authServiceMock = createAuthServiceMock({
      requestPasswordReset: async (input) => {
        requestedEmail = input.email;
      },
    });
    const controller = new AuthController(authServiceMock, refreshServiceMock);
    const app = createApp(controller);

    const response = await app.request("/auth/reset-password", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "user@example.com",
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "If an account exists, a password reset email has been sent.",
    });
    expect(requestedEmail).toBe("user@example.com");
  });

  it("returns validation errors for invalid reset requests", async () => {
    const controller = new AuthController(createAuthServiceMock(), refreshServiceMock);
    const app = createApp(controller);

    const response = await app.request("/auth/reset-password", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "not-an-email",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("error");
  });

  it("returns a safe unavailable response for request failures", async () => {
    const authServiceMock = createAuthServiceMock({
      requestPasswordReset: async () => {
        throw new Error("upstream down");
      },
    });
    const controller = new AuthController(authServiceMock, refreshServiceMock);
    const app = createApp(controller);

    const response = await app.request("/auth/reset-password", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "user@example.com",
      }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Password reset unavailable" });
  });
});

describe("AuthController.confirmResetPassword", () => {
  const refreshServiceMock: RefreshSessionServiceLike = {
    createSession: async () => ({ plainToken: "refresh_token_value" }),
    rotateSession: async () => null,
    revokeSession: async () => {},
  };

  it("confirms a password reset token", async () => {
    let resetInput: { token: string; newPassword: string } | undefined;
    const authServiceMock = createAuthServiceMock({
      confirmPasswordReset: async (input) => {
        resetInput = {
          token: input.token,
          newPassword: input.newPassword,
        };
      },
    });
    const controller = new AuthController(authServiceMock, refreshServiceMock);
    const app = createApp(controller);

    const response = await app.request("/auth/reset-password/confirm", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token: "reset_token_123",
        newPassword: "new-password-123",
        confirmPassword: "new-password-123",
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Password has been reset." });
    expect(resetInput).toEqual({
      token: "reset_token_123",
      newPassword: "new-password-123",
    });
  });

  it("returns validation errors when passwords do not match", async () => {
    const controller = new AuthController(createAuthServiceMock(), refreshServiceMock);
    const app = createApp(controller);

    const response = await app.request("/auth/reset-password/confirm", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token: "reset_token_123",
        newPassword: "new-password-123",
        confirmPassword: "different-password-123",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("error");
  });

  it("returns a safe invalid-token response for confirmation failures", async () => {
    const authServiceMock = createAuthServiceMock({
      confirmPasswordReset: async () => {
        throw new Error("invalid token");
      },
    });
    const controller = new AuthController(authServiceMock, refreshServiceMock);
    const app = createApp(controller);

    const response = await app.request("/auth/reset-password/confirm", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token: "reset_token_123",
        newPassword: "new-password-123",
        confirmPassword: "new-password-123",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid or expired password reset token" });
  });
});
