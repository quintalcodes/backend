import type { Context } from "hono";
import { log } from "../utils/logger";
import { UserService } from "../services/user-service";
import { getTenantPrismaFromContext } from "../lib/context-client";

export class UserController {
  private readonly userService: UserService = new UserService();

  async getCurrentUser(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);

      const user = await this.userService.getCurrentUser(prismaClient, workosUserId);

      return c.json({ message: "OK", data: user }, 200);
    } catch (error) {
      log.error("Failed to load current user", error);
      return c.json({ error: "Failed to load current user" }, 500);
    }
  }
}
