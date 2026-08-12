import { rateLimiter } from "hono-rate-limiter";
import { getConnInfo } from "hono/bun";

export const publicRouteLimiter = rateLimiter({
  windowMs: 60000,
  limit: 30,
  standardHeaders: true,
  keyGenerator: (c) => {
    const forwarded = c.req.header("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() ?? "unknown";
    }
    return getConnInfo(c).remote.address ?? "unknown";
  },
  message: { error: "Too many requests" },
});
