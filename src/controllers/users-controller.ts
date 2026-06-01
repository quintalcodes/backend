import type { Context } from "hono";
import { z } from "zod";
import { log } from "../utils/logger";
import { UsersService } from "../services/users-service";
import { getTenantPrismaFromContext } from "../lib/context-client";
import {
  createCompanyUserSchema,
  createVenueUserSchema,
  createUserSchema,
  inviteUserSchema,
  updateUserSchema,
  updateVenueUserSchema,
} from "../validators/users.schema";

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

  async updateUser(c: Context) {
    try {
      const { prismaClient, authId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = updateUserSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const user = await this.usersService.updateUser(prismaClient, validated.data, authId);

      return c.json({ message: "OK", data: user }, 200);
    } catch (error) {
      log.error("Failed to update user", error);
      return c.json({ error: "Failed to update user" }, 500);
    }
  }

  async inviteUser(c: Context) {
    try {
      const { prismaClient, organizationId, authId } = getTenantPrismaFromContext(c);

      // TODO: Check if user has permissions to invite users.
      const body = await c.req.json();

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

      return c.json({ message: "OK", data: newUser }, 200);
    } catch (error) {
      log.error("Failed to invite user", error);
      if (error instanceof Error && error.message === "User already invited to organization.") {
        return c.json({ error: "User already invited to organization." }, 400);
      }
      return c.json({ error: "Failed to invite user" }, 500);
    }
  }

  async createCompanyUser(c: Context) {
    try {
      const { prismaClient, authId } = getTenantPrismaFromContext(c);

      const body = await c.req.json();
      const validated = createCompanyUserSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }
    } catch (error) {
      log.error("Failed to create company user", error);
      return c.json({ error: "Failed to create company user" }, 500);
    }
  }

  async createVenueUser(c: Context) {
    try {
      const { prismaClient, authId } = getTenantPrismaFromContext(c);

      const body = await c.req.json();
      const validated = createVenueUserSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const venueUser = await this.usersService.createVenueUser(
        prismaClient,
        validated.data,
        authId,
      );

      return c.json({ message: "OK", data: venueUser }, 201);
    } catch (error) {
      log.error("Failed to create venue user", error);
      return c.json({ error: "Failed to create venue user" }, 500);
    }
  }

  async updateVenueUser(c: Context) {
    try {
      const { prismaClient, authId } = getTenantPrismaFromContext(c);

      const body = await c.req.json();
      const validated = updateVenueUserSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const venueUser = await this.usersService.updateVenueUser(
        prismaClient,
        validated.data,
        authId,
      );

      return c.json({ message: "OK", data: venueUser }, 200);
    } catch (error) {
      log.error("Failed to update venue user", error);
      return c.json({ error: "Failed to update venue user" }, 500);
    }
  }
  async getVenueUsers(c: Context) {
    try {
      const { prismaClient, authId } = getTenantPrismaFromContext(c);

      const venueId = c.req.param("venueId");

      // TODO: Check if incoming venueId is a valid.
      if (!venueId) {
        return c.json({ error: "Venue ID is required" }, 400);
      }

      const venueUsers = await this.usersService.getVenueUsers(prismaClient, venueId as string);

      return c.json({ message: "OK", data: venueUsers }, 200);
    } catch (error) {
      log.error("Failed to get venue users", error);
      return c.json({ error: "Failed to get venue users" }, 500);
    }
  }
  async getVenueUserRoles(c: Context) {
    try {
      const { prismaClient, authId } = getTenantPrismaFromContext(c);

      const venueUserRoles = await this.usersService.getVenueUserRoles(prismaClient);

      return c.json({ message: "OK", data: venueUserRoles }, 200);
    } catch (error) {
      log.error("Failed to get venue user roles", error);
      return c.json({ error: "Failed to get venue user roles" }, 500);
    }
  }
}
