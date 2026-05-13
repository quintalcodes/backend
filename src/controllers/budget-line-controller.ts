import type { Context } from "hono";
import { z } from "zod";
import { log } from "../utils/logger";
import { BudgetLineService } from "../services/budget-line-service";
import {
  createBudgetLineSchema,
  deleteBudgetLineSchema,
  updateBudgetLineSchema,
} from "../validators/budget-line.schema";
import { getTenantPrismaFromContext } from "../lib/context-client";

export class BudgetLineController {
  constructor(
    private readonly budgetLineService: BudgetLineService = new BudgetLineService(),
  ) {}

  async createBudgetLine(c: Context) {
    try {
      const { prismaClient } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = createBudgetLineSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const budgetLine = await this.budgetLineService.createBudgetLine(prismaClient, validated.data);
      log.info(`Budget line created successfully: ${budgetLine.id}`);

      return c.json({ message: "Budget line created successfully", data: budgetLine }, 201);
    } catch (error) {
      return c.json({ message: "Error creating Budget line" }, 500);
    }
  }

  async getBudgetLines(c: Context) {
    try {
      const { prismaClient } = getTenantPrismaFromContext(c);
      const items = await this.budgetLineService.getBudgetLines(prismaClient);
      return c.json({ message: "Budget lines fetched successfully", data: items }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Budget lines" }, 500);
    }
  }

  async getBudgetLineById(c: Context) {
    try {
      const { prismaClient } = getTenantPrismaFromContext(c);
      const { id } = c.req.param();
      const budgetLine = await this.budgetLineService.getBudgetLineById(prismaClient, id);
      if (!budgetLine) {
        return c.json({ message: "Budget line not found" }, 404);
      }
      return c.json({ message: "Budget line fetched successfully", data: budgetLine }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Budget line" }, 500);
    }
  }

  async updateBudgetLine(c: Context) {
    try {
      const { prismaClient } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = updateBudgetLineSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const budgetLine = await this.budgetLineService.updateBudgetLine(prismaClient, validated.data);
      if (!budgetLine) {
        return c.json({ message: "Budget line not found" }, 404);
      }
      log.info(`Budget line updated successfully: ${budgetLine.id}`);

      return c.json({ message: "Budget line updated successfully", data: budgetLine }, 200);
    } catch (error) {
      return c.json({ message: "Error updating Budget line" }, 500);
    }
  }

  async deleteBudgetLine(c: Context) {
    try {
      const { prismaClient } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = deleteBudgetLineSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const budgetLine = await this.budgetLineService.deleteBudgetLine(prismaClient, validated.data.id);
      if (!budgetLine) {
        return c.json({ message: "Budget line not found" }, 404);
      }
      return c.json({ message: "Budget line deleted successfully", data: budgetLine }, 200);
    } catch (error) {
      return c.json({ message: "Error deleting Budget line" }, 500);
    }
  }
}
