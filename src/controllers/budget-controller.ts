import type { Context } from "hono";
import { z } from "zod";
import { log } from "../utils/logger";
import { BudgetService } from "../services/budget-service";
import {
  createBudgetSchema,
  deleteBudgetSchema,
  updateBudgetSchema,
} from "../validators/budget.schema";
import { getTenantPrismaFromContext } from "../lib/context-client";

export class BudgetController {
  constructor(private readonly budgetService: BudgetService = new BudgetService()) {}

  async createBudget(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = createBudgetSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const existingBudget = await this.budgetService.getBudgetByDateRange(
        prismaClient,
        validated.data.periodStart,
        validated.data.periodEnd,
      );

      if (existingBudget.length > 0) {
        return c.json(
          { message: "Budget already exists for this period", data: existingBudget[0] },
          200,
        );
      }

      const budget = await this.budgetService.createBudget(
        prismaClient,
        workosUserId,
        validated.data,
      );
      log.info(`Budget created successfully: ${budget.id}`);

      return c.json({ message: "Budget created successfully", data: budget }, 201);
    } catch (error) {
      return c.json({ message: "Error creating Budget" }, 500);
    }
  }

  async getBudgets(c: Context) {
    try {
      const { prismaClient } = getTenantPrismaFromContext(c);
      const budgets = await this.budgetService.getBudgets(prismaClient);
      return c.json({ message: "Budgets fetched successfully", data: budgets }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Budgets" }, 500);
    }
  }

  async getBudgetById(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const { id } = c.req.param();
      const budget = await this.budgetService.getBudgetById(prismaClient, id);
      if (!budget) {
        return c.json({ message: "Budget not found" }, 404);
      }
      return c.json({ message: "Budget fetched successfully", data: budget }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Budget" }, 500);
    }
  }

  async updateBudget(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = updateBudgetSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const budget = await this.budgetService.updateBudget(prismaClient, validated.data);
      if (!budget) {
        return c.json({ message: "Budget not found" }, 404);
      }
      log.info(`Budget updated successfully: ${budget.id}`);

      return c.json({ message: "Budget updated successfully", data: budget }, 200);
    } catch (error) {
      return c.json({ message: "Error updating Budget" }, 500);
    }
  }

  async deleteBudget(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = deleteBudgetSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const budget = await this.budgetService.deleteBudget(prismaClient, validated.data.id);
      if (!budget) {
        return c.json({ message: "Budget not found" }, 404);
      }
      return c.json({ message: "Budget deleted successfully", data: budget }, 200);
    } catch (error) {
      return c.json({ message: "Error deleting Budget" }, 500);
    }
  }
}
