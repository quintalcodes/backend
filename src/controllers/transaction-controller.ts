import type { Context } from "hono";
import { z } from "zod";
import { log } from "../utils/logger";
import { TransactionService } from "../services/transaction-service";
import {
  createTransactionSchema,
  deleteTransactionSchema,
  updateTransactionSchema,
} from "../validators/transaction.schema";
import { getTenantPrismaFromContext } from "../lib/context-client";

export class TransactionController {
  constructor(private readonly transactionService: TransactionService = new TransactionService()) {}

  async createTransaction(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = createTransactionSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const transaction = await this.transactionService.createTransaction(
        prismaClient,
        workosUserId,
        validated.data,
      );
      log.info(`Transaction created successfully: ${transaction.id}`);

      return c.json({ message: "Transaction created successfully", data: transaction }, 201);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Account not found")) {
        return c.json({ message: "Account not found" }, 404);
      }
      if (error instanceof Error && error.message.includes("Transaction category not found")) {
        return c.json({ message: "Transaction category not found" }, 404);
      }
      return c.json({ message: "Error creating Transaction" }, 500);
    }
  }

  async getTransactions(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const transactions = await this.transactionService.getTransactions(prismaClient);
      return c.json({ message: "Transactions fetched successfully", data: transactions }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Transactions" }, 500);
    }
  }

  async getTransactionById(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const { id } = c.req.param();
      const transaction = await this.transactionService.getTransactionById(prismaClient, id);
      if (!transaction) {
        return c.json({ message: "Transaction not found" }, 404);
      }
      return c.json({ message: "Transaction fetched successfully", data: transaction }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Transaction" }, 500);
    }
  }

  async updateTransaction(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = updateTransactionSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const transaction = await this.transactionService.updateTransaction(
        prismaClient,
        validated.data,
      );
      if (!transaction) {
        return c.json({ message: "Transaction not found" }, 404);
      }
      log.info(`Transaction updated successfully: ${transaction.id}`);

      return c.json({ message: "Transaction updated successfully", data: transaction }, 200);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Account not found")) {
        return c.json({ message: "Account not found" }, 404);
      }
      if (error instanceof Error && error.message.includes("Transaction category not found")) {
        return c.json({ message: "Transaction category not found" }, 404);
      }
      return c.json({ message: "Error updating Transaction" }, 500);
    }
  }

  async deleteTransaction(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = deleteTransactionSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const transaction = await this.transactionService.deleteTransaction(
        prismaClient,
        validated.data.id,
      );
      if (!transaction) {
        return c.json({ message: "Transaction not found" }, 404);
      }
      return c.json({ message: "Transaction deleted successfully", data: transaction }, 200);
    } catch (error) {
      return c.json({ message: "Error deleting Transaction" }, 500);
    }
  }
}
