import { Hono } from "hono";
import { cors } from "hono/cors";
// controllers
import { AuthController } from "./controllers/auth-controller";
import { UserController } from "./controllers/user-controller";
import { AccountController } from "./controllers/account-controller";
import { TransactionController } from "./controllers/transaction-controller";
import { TransactionCategoryController } from "./controllers/transaction-category-controller";
import { RecurringTransactionController } from "./controllers/recurring-transaction-controller";
import { GoalController } from "./controllers/goal-controller";
import { GoalTransactionController } from "./controllers/goal-transaction-controller";
import { BudgetController } from "./controllers/budget-controller";
import { BudgetLineController } from "./controllers/budget-line-controller";
import { AnalyticsController } from "./controllers/analytics-controller";
// controller constructors
const authController = new AuthController();
const userController = new UserController();
const accountController = new AccountController();
const transactionController = new TransactionController();
const transactionCategoryController = new TransactionCategoryController();
const recurringTransactionController = new RecurringTransactionController();
const goalController = new GoalController();
const goalTransactionController = new GoalTransactionController();
const budgetController = new BudgetController();
const budgetLineController = new BudgetLineController();
const analyticsController = new AnalyticsController();
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
    origin: corsOrigins,
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

app.get("/api/user/current", (c) => userController.getCurrentUser(c));

app.get("/api/account", (c) => accountController.getAccounts(c));
app.post("/api/account", (c) => accountController.createAccount(c));
app.patch("/api/account", (c) => accountController.updateAccount(c));
app.delete("/api/account", (c) => accountController.deleteAccount(c));
app.get("/api/account/:id", (c) => accountController.getAccountById(c));

app.get("/api/transaction", (c) => transactionController.getTransactions(c));
app.post("/api/transaction", (c) => transactionController.createTransaction(c));
app.patch("/api/transaction", (c) => transactionController.updateTransaction(c));
app.delete("/api/transaction", (c) => transactionController.deleteTransaction(c));
app.get("/api/transaction/:id", (c) => transactionController.getTransactionById(c));

app.get("/api/transaction-category", (c) =>
  transactionCategoryController.getTransactionCategories(c),
);
app.post("/api/transaction-category", (c) =>
  transactionCategoryController.createTransactionCategory(c),
);
app.patch("/api/transaction-category", (c) =>
  transactionCategoryController.updateTransactionCategory(c),
);
app.delete("/api/transaction-category", (c) =>
  transactionCategoryController.deleteTransactionCategory(c),
);
app.get("/api/transaction-category/:id", (c) =>
  transactionCategoryController.getTransactionCategoryById(c),
);

app.get("/api/recurring-transaction", (c) =>
  recurringTransactionController.getRecurringTransactions(c),
);
app.post("/api/recurring-transaction", (c) =>
  recurringTransactionController.createRecurringTransaction(c),
);
app.patch("/api/recurring-transaction", (c) =>
  recurringTransactionController.updateRecurringTransaction(c),
);
app.delete("/api/recurring-transaction", (c) =>
  recurringTransactionController.deleteRecurringTransaction(c),
);
app.get("/api/recurring-transaction/:id", (c) =>
  recurringTransactionController.getRecurringTransactionById(c),
);

app.get("/api/goal", (c) => goalController.getGoals(c));
app.post("/api/goal", (c) => goalController.createGoal(c));
app.patch("/api/goal", (c) => goalController.updateGoal(c));
app.delete("/api/goal", (c) => goalController.deleteGoal(c));
app.get("/api/goal/:id", (c) => goalController.getGoalById(c));

app.get("/api/goal-transaction", (c) => goalTransactionController.getGoalTransactions(c));
app.post("/api/goal-transaction", (c) => goalTransactionController.createGoalTransaction(c));
app.patch("/api/goal-transaction", (c) => goalTransactionController.updateGoalTransaction(c));
app.delete("/api/goal-transaction", (c) => goalTransactionController.deleteGoalTransaction(c));
app.get("/api/goal-transaction/:id", (c) => goalTransactionController.getGoalTransactionById(c));

app.get("/api/budget", (c) => budgetController.getBudgets(c));
app.post("/api/budget", (c) => budgetController.createBudget(c));
app.patch("/api/budget", (c) => budgetController.updateBudget(c));
app.delete("/api/budget", (c) => budgetController.deleteBudget(c));
app.get("/api/budget/:id", (c) => budgetController.getBudgetById(c));

app.get("/api/budget-line", (c) => budgetLineController.getBudgetLines(c));
app.post("/api/budget-line", (c) => budgetLineController.createBudgetLine(c));
app.patch("/api/budget-line", (c) => budgetLineController.updateBudgetLine(c));
app.delete("/api/budget-line", (c) => budgetLineController.deleteBudgetLine(c));
app.get("/api/budget-line/:id", (c) => budgetLineController.getBudgetLineById(c));

app.post("/api/analytics/monthly-budget-summary", (c) =>
  analyticsController.getMonthlyBudgetSummary(c),
);

log.info("Server started!");
export default {
  hostname: Bun.env.BACKEND_IP || "127.0.0.1",
  port: parseInt(Bun.env.BACKEND_PORT || "3060"),
  fetch: app.fetch,
};
