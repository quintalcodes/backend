import { createHash, randomBytes } from "node:crypto";

export function generateRefreshToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(plain: string) {
  return createHash("sha256").update(plain).digest("hex");
}
