import type { Context } from "hono";
import { z } from "zod";
import { log } from "../utils/logger";
import { UsersService } from "../services/users-service";
import { getTenantPrismaFromContext } from "../lib/context-client";
import { createUserSchema, inviteUserSchema } from "../validators/users.schema";

export class UsersController {
  private readonly usersService: UsersService = new UsersService();

  async getCurrentUser(c: Context) {
    try {
      const { prismaClient, authId } = getTenantPrismaFromContext(c);

      const user = await this.usersService.getCurrentUser(prismaClient, authId);

      return c.json({ message: "OK", data: user }, 200);
    } catch (error) {
      log.error("Failed to load current user", error);
      return c.json({ error: "Failed to load current user" }, 500);
    }
  }

  async createUser(c: Context) {
    try {
      const { prismaClient, authId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = createUserSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const newUser = await this.usersService.createUser(prismaClient, validated.data, authId);

      return c.json({ message: "OK", data: newUser }, 201);
    } catch (error) {
      log.error("Failed to create user", error);
      return c.json({ error: "Failed to create user" }, 500);
    }
  }

  async inviteUser(c: Context) {
    try {
      const { prismaClient, organizationId, authId } = getTenantPrismaFromContext(c);

      // TODO: Check if user has permissions to invite users.
      const body = await c.req.json();
      console.log(body);
      const validated = inviteUserSchema.safeParse(body);

      if (!validated.success) {
        console.log(validated.error);
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const newUser = await this.usersService.inviteUser(
        prismaClient,
        validated.data,
        organizationId,
        authId,
      );

      console.log(newUser);
      return c.json({ message: "OK" }, 200);
    } catch (error) {
      log.error("Failed to invite user", error);
      return c.json({ error: "Failed to invite user" }, 500);
    }
  }
}
