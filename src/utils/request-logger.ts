import type { Context, Next } from "hono";
import { log } from "../utils/logger";

const BODY_METHODS = new Set(["POST", "PUT", "PATCH"]);

async function getBodyForLog(req: Request): Promise<unknown> {
  if (!BODY_METHODS.has(req.method)) return undefined;
  try {
    const clone = req.clone();
    const text = await clone.text();
    if (!text) return undefined;
    const trimmed = text.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return JSON.parse(text) as unknown;
    }
    return text;
  } catch {
    return undefined;
  }
}

export async function requestLogger(c: Context, next: Next) {
  const start = performance.now();
  const method = c.req.method;
  const path = c.req.path;
  const url = c.req.url;
  const body = await getBodyForLog(c.req.raw);

  log.info("request", { method, path, url, body: body ?? undefined });

  await next();

  let responseBody: unknown;
  try {
    const clone = c.res.clone();
    const text = await clone.text();
    if (text) {
      const trimmed = text.trim();
      responseBody =
        trimmed.startsWith("{") || trimmed.startsWith("[") ? (JSON.parse(text) as unknown) : text;
    }
  } catch {
    responseBody = undefined;
  }

  const status = c.res.status;
  const durationMs = Math.round(performance.now() - start);
  log.info("response", { method, path, status, durationMs, body: responseBody });
}
