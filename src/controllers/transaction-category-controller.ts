import type { Context } from "hono";
import { z } from "zod";
import { log } from "../utils/logger";
import { TransactionCategoryService } from "../services/transaction-category-service";
import {
  createTransactionCategorySchema,
  deleteTransactionCategorySchema,
  updateTransactionCategorySchema,
} from "../validators/transaction-category.schema";
import { getTenantPrismaFromContext } from "../lib/context-client";

export class TransactionCategoryController {
  constructor(
    private readonly transactionCategoryService: TransactionCategoryService = new TransactionCategoryService(),
  ) {}

  async createTransactionCategory(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = createTransactionCategorySchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const category = await this.transactionCategoryService.createTransactionCategory(
        prismaClient,
        workosUserId,
        validated.data,
      );
      log.info(`Transaction category created successfully: ${category.id}`);

      return c.json({ message: "Transaction category created successfully", data: category }, 201);
    } catch (error) {
      return c.json({ message: "Error creating Transaction category" }, 500);
    }
  }

  async getTransactionCategories(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const categories = await this.transactionCategoryService.getTransactionCategories(
        prismaClient,
        workosUserId,
      );
      return c.json({ message: "Transaction categories fetched successfully", data: categories }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Transaction categories" }, 500);
    }
  }

  async getTransactionCategoryById(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const { id } = c.req.param();
      const category = await this.transactionCategoryService.getTransactionCategoryById(
        prismaClient,
        workosUserId,
        id,
      );
      if (!category) {
        return c.json({ message: "Transaction category not found" }, 404);
      }
      return c.json({ message: "Transaction category fetched successfully", data: category }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Transaction category" }, 500);
    }
  }

  async updateTransactionCategory(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = updateTransactionCategorySchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const category = await this.transactionCategoryService.updateTransactionCategory(
        prismaClient,
        workosUserId,
        validated.data,
      );
      if (!category) {
        return c.json({ message: "Transaction category not found" }, 404);
      }
      log.info(`Transaction category updated successfully: ${category.id}`);

      return c.json({ message: "Transaction category updated successfully", data: category }, 200);
    } catch (error) {
      return c.json({ message: "Error updating Transaction category" }, 500);
    }
  }

  async deleteTransactionCategory(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = deleteTransactionCategorySchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const category = await this.transactionCategoryService.deleteTransactionCategory(
        prismaClient,
        workosUserId,
        validated.data.id,
      );
      if (!category) {
        return c.json({ message: "Transaction category not found" }, 404);
      }
      return c.json({ message: "Transaction category deleted successfully", data: category }, 200);
    } catch (error) {
      if (error instanceof Error && error.message === "TRANSACTION_CATEGORY_IN_USE") {
        return c.json({ message: "Transaction category is in use and cannot be deleted" }, 409);
      }
      return c.json({ message: "Error deleting Transaction category" }, 500);
    }
  }
}
