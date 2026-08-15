// Startup Checks
import "./startup";

import { Hono } from "hono";
import { cors } from "hono/cors";
// controllers
import { authController } from "./controllers/auth-controller";
// controller constructors
// middleware
import { authMiddleware } from "./middleware/auth-middleware";
import { tenantMiddleware } from "./middleware/tenant-middleware";
import { publicRouteLimiter } from "./middleware/rate-limit-middleware";
import { adminMiddleware } from "./middleware/admin-middleware";
// utils
import { log } from "./utils/logger";
// types
import type { Variables } from "./types/hono-env";
import { adminController } from "./controllers/admin-controller";
import { adminService } from "./services/admin-service";

const app = new Hono<{ Variables: Variables }>();

log.info("Starting server ...");

// Cors, Headers, Methods
const corsOrigins = Bun.env.CORS_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: "*",
    credentials: true,
    allowHeaders: ["Authorization", "Content-Type", "x-api-key"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// Public routes
app.post("/api/login", publicRouteLimiter, (c) => authController.loginWithPassword(c));
app.post("/api/auth/refresh", publicRouteLimiter, (c) => authController.refreshToken(c));
app.post("/api/auth/logout", publicRouteLimiter, (c) => authController.logout(c));
app.post("/api/auth/reset-password", publicRouteLimiter, (c) => authController.resetPassword(c));
app.post("/api/auth/reset-password/confirm", publicRouteLimiter, (c) =>
  authController.confirmResetPassword(c),
);

// Protected routes
app.use("/api/*", authMiddleware);
app.use("/api/*", tenantMiddleware);

// protected routes heree:

// Admin routes
app.use("/admin/*", adminMiddleware);
app.post("/admin/create-tenant", (c) => adminController.createTenant(c));
app.get("/admin/tenants", (c) => adminController.listTenants(c));

log.info("Server started!");
export default {
  hostname: Bun.env.BACKEND_IP || "127.0.0.1",
  port: parseInt(Bun.env.BACKEND_PORT || "3060"),
  fetch: app.fetch,
};
