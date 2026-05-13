import type { Context } from "hono";
import { z } from "zod";
import { log } from "../utils/logger";
import { GoalTransactionService } from "../services/goal-transaction-service";
import {
  createGoalTransactionSchema,
  deleteGoalTransactionSchema,
  updateGoalTransactionSchema,
} from "../validators/goal-transaction.schema";
import { getTenantPrismaFromContext } from "../lib/context-client";

export class GoalTransactionController {
  constructor(
    private readonly goalTransactionService: GoalTransactionService = new GoalTransactionService(),
  ) {}

  async createGoalTransaction(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = createGoalTransactionSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const goalTransaction = await this.goalTransactionService.createGoalTransaction(
        prismaClient,
        workosUserId,
        validated.data,
      );
      log.info(`Goal transaction created successfully: ${goalTransaction.id}`);

      return c.json({ message: "Goal transaction created successfully", data: goalTransaction }, 201);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Goal not found")) {
        return c.json({ message: "Goal not found" }, 404);
      }
      return c.json({ message: "Error creating Goal transaction" }, 500);
    }
  }

  async getGoalTransactions(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const items = await this.goalTransactionService.getGoalTransactions(prismaClient, workosUserId);
      return c.json({ message: "Goal transactions fetched successfully", data: items }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Goal transactions" }, 500);
    }
  }

  async getGoalTransactionById(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const { id } = c.req.param();
      const goalTransaction = await this.goalTransactionService.getGoalTransactionById(
        prismaClient,
        workosUserId,
        id,
      );
      if (!goalTransaction) {
        return c.json({ message: "Goal transaction not found" }, 404);
      }
      return c.json({ message: "Goal transaction fetched successfully", data: goalTransaction }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Goal transaction" }, 500);
    }
  }

  async updateGoalTransaction(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = updateGoalTransactionSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const goalTransaction = await this.goalTransactionService.updateGoalTransaction(
        prismaClient,
        workosUserId,
        validated.data,
      );
      if (!goalTransaction) {
        return c.json({ message: "Goal transaction not found" }, 404);
      }
      log.info(`Goal transaction updated successfully: ${goalTransaction.id}`);

      return c.json({ message: "Goal transaction updated successfully", data: goalTransaction }, 200);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Goal not found")) {
        return c.json({ message: "Goal not found" }, 404);
      }
      return c.json({ message: "Error updating Goal transaction" }, 500);
    }
  }

  async deleteGoalTransaction(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = deleteGoalTransactionSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const goalTransaction = await this.goalTransactionService.deleteGoalTransaction(
        prismaClient,
        workosUserId,
        validated.data.id,
      );
      if (!goalTransaction) {
        return c.json({ message: "Goal transaction not found" }, 404);
      }
      return c.json({ message: "Goal transaction deleted successfully", data: goalTransaction }, 200);
    } catch (error) {
      return c.json({ message: "Error deleting Goal transaction" }, 500);
    }
  }
}
