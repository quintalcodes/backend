import type { Context } from "hono";
import { z } from "zod";
import { log } from "../utils/logger";
import { RecurringTransactionService } from "../services/recurring-transaction-service";
import {
  createRecurringTransactionSchema,
  deleteRecurringTransactionSchema,
  updateRecurringTransactionSchema,
} from "../validators/recurring-transaction.schema";
import { getTenantPrismaFromContext } from "../lib/context-client";

export class RecurringTransactionController {
  constructor(
    private readonly recurringTransactionService: RecurringTransactionService = new RecurringTransactionService(),
  ) {}

  async createRecurringTransaction(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = createRecurringTransactionSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const recurring = await this.recurringTransactionService.createRecurringTransaction(
        prismaClient,
        workosUserId,
        validated.data,
      );
      log.info(`Recurring transaction created successfully: ${recurring.id}`);

      return c.json({ message: "Recurring transaction created successfully", data: recurring }, 201);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Account not found")) {
        return c.json({ message: "Account not found" }, 404);
      }
      if (error instanceof Error && error.message.includes("Transaction category not found")) {
        return c.json({ message: "Transaction category not found" }, 404);
      }
      return c.json({ message: "Error creating Recurring transaction" }, 500);
    }
  }

  async getRecurringTransactions(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const items = await this.recurringTransactionService.getRecurringTransactions(
        prismaClient,
        workosUserId,
      );
      return c.json({ message: "Recurring transactions fetched successfully", data: items }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Recurring transactions" }, 500);
    }
  }

  async getRecurringTransactionById(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const { id } = c.req.param();
      const recurring = await this.recurringTransactionService.getRecurringTransactionById(
        prismaClient,
        workosUserId,
        id,
      );
      if (!recurring) {
        return c.json({ message: "Recurring transaction not found" }, 404);
      }
      return c.json({ message: "Recurring transaction fetched successfully", data: recurring }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Recurring transaction" }, 500);
    }
  }

  async updateRecurringTransaction(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = updateRecurringTransactionSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const recurring = await this.recurringTransactionService.updateRecurringTransaction(
        prismaClient,
        workosUserId,
        validated.data,
      );
      if (!recurring) {
        return c.json({ message: "Recurring transaction not found" }, 404);
      }
      log.info(`Recurring transaction updated successfully: ${recurring.id}`);

      return c.json({ message: "Recurring transaction updated successfully", data: recurring }, 200);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Account not found")) {
        return c.json({ message: "Account not found" }, 404);
      }
      if (error instanceof Error && error.message.includes("Transaction category not found")) {
        return c.json({ message: "Transaction category not found" }, 404);
      }
      return c.json({ message: "Error updating Recurring transaction" }, 500);
    }
  }

  async deleteRecurringTransaction(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = deleteRecurringTransactionSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const recurring = await this.recurringTransactionService.deleteRecurringTransaction(
        prismaClient,
        workosUserId,
        validated.data.id,
      );
      if (!recurring) {
        return c.json({ message: "Recurring transaction not found" }, 404);
      }
      return c.json({ message: "Recurring transaction deleted successfully", data: recurring }, 200);
    } catch (error) {
      return c.json({ message: "Error deleting Recurring transaction" }, 500);
    }
  }
}
