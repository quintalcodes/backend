const DEFAULT_REFRESH_TOKEN_EXPIRES_DAYS = 30;

export const REFRESH_COOKIE_NAME = "vl_refresh";
export const REFRESH_COOKIE_PATH = "/api/auth";

function getRefreshTokenExpiresDays() {
  const raw = Bun.env.REFRESH_TOKEN_EXPIRES_DAYS;

  if (!raw) {
    return DEFAULT_REFRESH_TOKEN_EXPIRES_DAYS;
  }

  const days = Number(raw);

  if (!Number.isInteger(days) || days <= 0) {
    throw new Error("REFRESH_TOKEN_EXPIRES_DAYS must be a positive integer");
  }

  return days;
}

export function getRefreshCookieMaxAgeSeconds() {
  return getRefreshTokenExpiresDays() * 24 * 60 * 60;
}

export function getRefreshTokenExpiryDate() {
  return new Date(Date.now() + getRefreshCookieMaxAgeSeconds() * 1000);
}

export function getRefreshCookieSecure() {
  const explicit = Bun.env.REFRESH_COOKIE_SECURE;

  if (explicit === "true") return true;
  if (explicit === "false") return false;

  return Bun.env.NODE_ENV === "production";
}
