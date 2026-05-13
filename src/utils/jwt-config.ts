const DEFAULT_JWT_EXPIRES_IN_SECONDS = 15 * 60;
const DEFAULT_JWT_ISSUER = "venuelog-backend";
const DEFAULT_JWT_AUDIENCE = "venuelog-api";

export function getJwtSecret() {
  const jwtSecret = Bun.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwtSecret;
}

export function getJwtExpiresInSeconds() {
  const jwtExpiresIn = Bun.env.JWT_EXPIRES_IN_SECONDS;

  if (!jwtExpiresIn) {
    return DEFAULT_JWT_EXPIRES_IN_SECONDS;
  }

  const parsed = Number(jwtExpiresIn);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("JWT_EXPIRES_IN_SECONDS must be a positive integer");
  }

  return parsed;
}

export function getJwtIssuer() {
  return Bun.env.JWT_ISSUER || DEFAULT_JWT_ISSUER;
}

export function getJwtAudience() {
  return Bun.env.JWT_AUDIENCE || DEFAULT_JWT_AUDIENCE;
}
