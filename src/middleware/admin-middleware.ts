import { createMiddleware } from "hono/factory";

type AdminMiddlewareOptions = {
  getApiKey?: () => string;
};


const getAdminApiKey = () => {
  const apiKey = Bun.env.ADMIN_API_KEY;

  if (!apiKey) {
    throw new Error("ADMIN_API_KEY is not configured");
  }

  return apiKey;
};

export const createAdminMiddleware = ({
  getApiKey = getAdminApiKey,
}: AdminMiddlewareOptions = {}) =>
  createMiddleware(async (c, next) => {
    const apiKey = c.req.header("x-api-key");

    if (!apiKey || apiKey !== getApiKey()) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await next();
  });

export const adminMiddleware = createAdminMiddleware();
