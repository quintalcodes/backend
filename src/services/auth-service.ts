import { sign } from "hono/jwt";
import type { WorkOS } from "@workos-inc/node";
import { getWorkOSClient } from "../lib/workos-client";
import {
  getJwtAudience,
  getJwtExpiresInSeconds,
  getJwtIssuer,
  getJwtSecret,
} from "../utils/jwt-config";
import type { LoginWithPasswordInput } from "../validators/auth.schema";

type LoginWithPasswordContext = {
  ipAddress?: string;
  userAgent?: string;
};

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

const isInvalidCredentialsError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
  };

  return (
    candidate.code === "authentication_error" ||
    candidate.status === 401 ||
    candidate.statusCode === 401
  );
};

export class AuthService {
  async loginWithPassword(input: LoginWithPasswordInput, context: LoginWithPasswordContext = {}) {
    const client = getWorkOSClient();
    let response: Awaited<ReturnType<WorkOS["userManagement"]["authenticateWithPassword"]>>;

    try {
      response = await client.userManagement.authenticateWithPassword({
        email: input.email,
        password: input.password,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    } catch (error) {
      if (isInvalidCredentialsError(error)) {
        throw new InvalidCredentialsError();
      }

      throw error;
    }

    const organizationId = response.organizationId;

    if (!organizationId) {
      throw new Error("organizationId is required");
    }

    const { accessToken, expiresIn } = await this.issueAccessToken(
      response.user.id,
      organizationId,
    );

    // console.log("accessToken", accessToken);
    // console.log("expiresIn", expiresIn);
    console.log("response", response);
    // console.log("workosUserId", response.user.id);
    // console.log("organizationId", organizationId);
    return { accessToken, expiresIn, workosUserId: response.user.id, organizationId };
  }

  async issueAccessToken(workosUserId: string, organizationId: string) {
    const expiresIn = getJwtExpiresInSeconds();
    const now = Math.floor(Date.now() / 1000);

    // We can add custom values here that will be added to the JWT payload.
    const accessToken = await sign(
      {
        sub: workosUserId,
        iat: now,
        exp: now + expiresIn,
        iss: getJwtIssuer(),
        aud: getJwtAudience(),
        organizationId,
      },
      getJwtSecret(),
    );

    return { accessToken, expiresIn };
  }
}
