import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { AuthService, InvalidCredentialsError } from "../services/auth-service";
import { RefreshSessionService } from "../services/refresh-session.service";
import { loginWithPasswordSchema } from "../validators/auth.schema";
import type { LoginResponse } from "../types/workos-types";
import { log } from "../utils/logger";
import {
  getRefreshCookieMaxAgeSeconds,
  getRefreshCookieSecure,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
} from "../utils/refresh-cookie-config";

type AuthServiceLike = Pick<AuthService, "loginWithPassword" | "issueAccessToken">;
type RefreshSessionServiceLike = Pick<
  RefreshSessionService,
  "createSession" | "rotateSession" | "revokeSession"
>;

const getIpAddress = (c: Context) => {
  const forwardedFor = c.req.header("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return c.req.header("x-real-ip") || c.req.header("cf-connecting-ip");
};

export class AuthController {
  constructor(
    private readonly authService: AuthServiceLike = new AuthService(),
    private readonly refreshSessionService: RefreshSessionServiceLike = new RefreshSessionService(),
  ) {}

  async loginWithPassword(c: Context) {
    const validated = loginWithPasswordSchema.safeParse(await c.req.json());

    if (!validated.success) {
      return c.json({ error: z.treeifyError(validated.error) }, 400);
    }

    try {
      const data = await this.authService.loginWithPassword(validated.data, {
        ipAddress: getIpAddress(c),
        userAgent: c.req.header("user-agent"),
      });

      const session = await this.refreshSessionService.createSession({
        workosUserId: data.workosUserId,
        organizationId: data.organizationId,
      });

      setRefreshCookie(c, session.plainToken);

      return c.json<LoginResponse>(
        { accessToken: data.accessToken, expiresIn: data.expiresIn },
        200,
      );
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return c.json({ error: "Invalid credentials" }, 401);
      }

      log.error("Login failed", error);
      return c.json({ error: "Authentication unavailable" }, 500);
    }
  }
  async refreshToken(c: Context) {
    const refreshToken = getCookie(c, REFRESH_COOKIE_NAME);
    if (!refreshToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const rotated = await this.refreshSessionService.rotateSession(refreshToken);
    if (!rotated) {
      clearRefreshCookie(c);
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = await this.authService.issueAccessToken(
      rotated.workosUserId,
      rotated.organizationId,
    );

    setRefreshCookie(c, rotated.nextPlainToken);
    return c.json<LoginResponse>(token, 200);
  }

  async logout(c: Context) {
    const refreshToken = getCookie(c, REFRESH_COOKIE_NAME);

    if (refreshToken) {
      await this.refreshSessionService.revokeSession(refreshToken);
    }

    clearRefreshCookie(c);
    return c.json({ message: "Signed out" }, 200);
  }
}

function setRefreshCookie(c: Context, plainToken: string) {
  setCookie(c, REFRESH_COOKIE_NAME, plainToken, {
    httpOnly: true,
    secure: getRefreshCookieSecure(),
    sameSite: "Lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: getRefreshCookieMaxAgeSeconds(),
  });
}

function clearRefreshCookie(c: Context) {
  deleteCookie(c, REFRESH_COOKIE_NAME, {
    path: REFRESH_COOKIE_PATH,
    secure: getRefreshCookieSecure(),
  });
}
