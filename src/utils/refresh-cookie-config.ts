const DEFAULT_REFRESH_TOKEN_EXPIRES_DAYS = 30;

export const REFRESH_COOKIE_NAME = "vl_refresh";
export const REFRESH_COOKIE_PATH = "/api/auth";

export function getRefreshCookieMaxAgeSeconds() {
  const envValue = Bun.env.REFRESH_TOKEN_EXPIRES_DAYS ?? DEFAULT_REFRESH_TOKEN_EXPIRES_DAYS;
  const days = Number(envValue);

  return days * 24 * 60 * 60;
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
