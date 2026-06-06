import { Hono } from "hono";
import { cors } from "hono/cors";
// controllers
import { AuthController } from "./controllers/auth-controller";
import { UsersController } from "./controllers/users-controller";
import { AnalyticsController } from "./controllers/analytics-controller";
import { CompaniesController } from "./controllers/companies-controller";
import { VenuesController } from "./controllers/venue-controller";
// controller constructors
const authController = new AuthController();
const usersController = new UsersController();
const analyticsController = new AnalyticsController();
const companiesController = new CompaniesController();
const venuesController = new VenuesController();
// middleware
import { authMiddleware } from "./middleware/auth-middleware";
import { tenantMiddleware } from "./middleware/tenant-middleware";
import { publicRouteLimiter } from "./middleware/rate-limit-middleware";
// utils
import { log } from "./utils/logger";
// types
import type { Variables } from "./types/hono-env";

const app = new Hono<{ Variables: Variables }>();

log.info("Starting server ...");

const corsOrigins = Bun.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: "*",
    credentials: true,
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// Public routes
app.post("/api/login", publicRouteLimiter, (c) => authController.loginWithPassword(c));
app.post("/api/auth/refresh", publicRouteLimiter, (c) => authController.refreshToken(c));
app.post("/api/auth/logout", publicRouteLimiter, (c) => authController.logout(c));

// Protected routes
app.use("/api/*", authMiddleware);
app.use("/api/*", tenantMiddleware);

// users
app.patch("/api/users", (c) => usersController.updateUser(c));
app.get("/api/users/current", (c) => usersController.getCurrentUser(c));
app.post("/api/users/invite", (c) => usersController.inviteUser(c));
app.post("/api/users/venue-users", (c) => usersController.createVenueUser(c));
app.patch("/api/users/venue-users", (c) => usersController.updateVenueUser(c));
app.post("/api/users/company-users", (c) => usersController.createCompanyUser(c));

app.get("/api/users/venue-users/roles", (c) => usersController.getVenueUserRoles(c));
app.get("/api/users/venue-users/:venueId", (c) => usersController.getVenueUsers(c));

// companies
app.get("/api/companies", (c) => companiesController.getCompanies(c));
app.post("/api/companies", (c) => companiesController.createCompany(c));
app.patch("/api/companies", (c) => companiesController.updateCompany(c));
app.get("/api/companies/:id", (c) => companiesController.getCompanyById(c));

// company settings 

// venues
app.get("/api/venues", (c) => venuesController.getAllVenues(c));
app.post("/api/venues", (c) => venuesController.createVenue(c));

// company users.

app.post("/api/analytics/monthly-budget-summary", (c) =>
  analyticsController.getMonthlyBudgetSummary(c),
);

log.info("Server started!");
export default {
  hostname: Bun.env.BACKEND_IP || "127.0.0.1",
  port: parseInt(Bun.env.BACKEND_PORT || "3060"),
  fetch: app.fetch,
};
