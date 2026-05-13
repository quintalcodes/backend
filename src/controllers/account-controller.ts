import type { Context } from "hono";
import { z } from "zod";
import { log } from "../utils/logger";
import { AccountService } from "../services/account-service";
import { createAccountSchema, deleteAccountSchema, updateAccountSchema } from "../validators/account.schema";
import { getTenantPrismaFromContext } from "../lib/context-client";

export class AccountController {
  constructor(private readonly accountService: AccountService = new AccountService()) {}

  async createAccount(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = createAccountSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const account = await this.accountService.createAccount(prismaClient, workosUserId, validated.data);
      log.info(`Account created successfully: ${account.id}`);

      return c.json({ message: "Account created successfully", data: account }, 201);
    } catch (error) {
      return c.json({ message: "Error creating Account" }, 500);
    }
  }

  async getAccounts(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const accounts = await this.accountService.getAccounts(prismaClient, workosUserId);
      return c.json({ message: "Accounts fetched successfully", data: accounts }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Accounts" }, 500);
    }
  }

  async getAccountById(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const { id } = c.req.param();
      const account = await this.accountService.getAccountById(prismaClient, workosUserId, id);
      if (!account) {
        return c.json({ message: "Account not found" }, 404);
      }
      return c.json({ message: "Account fetched successfully", data: account }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Account" }, 500);
    }
  }

  async updateAccount(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = updateAccountSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const account = await this.accountService.updateAccount(prismaClient, workosUserId, validated.data);
      if (!account) {
        return c.json({ message: "Account not found" }, 404);
      }
      log.info(`Account updated successfully: ${account.id}`);

      return c.json({ message: "Account updated successfully", data: account }, 200);
    } catch (error) {
      return c.json({ message: "Error updating Account" }, 500);
    }
  }

  async deleteAccount(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = deleteAccountSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const account = await this.accountService.deleteAccount(prismaClient, workosUserId, validated.data.id);
      if (!account) {
        return c.json({ message: "Account not found" }, 404);
      }
      return c.json({ message: "Account deleted successfully", data: account }, 200);
    } catch (error) {
      return c.json({ message: "Error deleting Account" }, 500);
    }
  }
}
