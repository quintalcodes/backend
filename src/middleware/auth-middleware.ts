import { verify } from "hono/jwt";
import { createMiddleware } from "hono/factory";
import type { Variables } from "../types/hono-env";
import {
  getJwtAudience,
  getJwtIssuer,
  getJwtSecret,
} from "../utils/jwt-config";

type AuthJwtPayload = Record<string, unknown> & {
  sub: string;
  organizationId: string;
  iss: string;
  aud: string;
};

type VerifyToken = (
  token: string,
  secret: string,
  algorithm: "HS256",
) => Promise<Record<string, unknown>>;

type AuthMiddlewareOptions = {
  verifyToken?: VerifyToken;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const validatePayload = (
  payload: Record<string, unknown>,
  expectedIssuer: string,
  expectedAudience: string,
): AuthJwtPayload | null => {
  if (
    !isNonEmptyString(payload.sub) ||
    !isNonEmptyString(payload.organizationId) ||
    !isNonEmptyString(payload.iss) ||
    !isNonEmptyString(payload.aud)
  ) {
    return null;
  }

  if (payload.iss !== expectedIssuer || payload.aud !== expectedAudience) {
    return null;
  }

  return payload as AuthJwtPayload;
};

export const createAuthMiddleware = ({
  verifyToken = verify as VerifyToken,
}: AuthMiddlewareOptions = {}) =>
  createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.slice(7);

    let payload: Record<string, unknown>;

    try {
      payload = await verifyToken(token, getJwtSecret(), "HS256");
    } catch {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const validatedPayload = validatePayload(
      payload,
      getJwtIssuer(),
      getJwtAudience(),
    );

    if (!validatedPayload) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("auth", {
      userId: validatedPayload.sub,
      organizationId: validatedPayload.organizationId,
    });

    await next();
  });

export const authMiddleware = createAuthMiddleware();
