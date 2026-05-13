import type { Context } from "hono";
import { z } from "zod";
import { log } from "../utils/logger";
import { GoalService } from "../services/goal-service";
import { createGoalSchema, deleteGoalSchema, updateGoalSchema } from "../validators/goal.schema";
import { getTenantPrismaFromContext } from "../lib/context-client";

export class GoalController {
  constructor(private readonly goalService: GoalService = new GoalService()) {}

  async createGoal(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = createGoalSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const goal = await this.goalService.createGoal(prismaClient, workosUserId, validated.data);
      log.info(`Goal created successfully: ${goal.id}`);

      return c.json({ message: "Goal created successfully", data: goal }, 201);
    } catch (error) {
      return c.json({ message: "Error creating Goal" }, 500);
    }
  }

  async getGoals(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const goals = await this.goalService.getGoals(prismaClient, workosUserId);
      return c.json({ message: "Goals fetched successfully", data: goals }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Goals" }, 500);
    }
  }

  async getGoalById(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const { id } = c.req.param();
      const goal = await this.goalService.getGoalById(prismaClient, workosUserId, id);
      if (!goal) {
        return c.json({ message: "Goal not found" }, 404);
      }
      return c.json({ message: "Goal fetched successfully", data: goal }, 200);
    } catch (error) {
      return c.json({ message: "Error fetching Goal" }, 500);
    }
  }

  async updateGoal(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = updateGoalSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const goal = await this.goalService.updateGoal(prismaClient, workosUserId, validated.data);
      if (!goal) {
        return c.json({ message: "Goal not found" }, 404);
      }
      log.info(`Goal updated successfully: ${goal.id}`);

      return c.json({ message: "Goal updated successfully", data: goal }, 200);
    } catch (error) {
      return c.json({ message: "Error updating Goal" }, 500);
    }
  }

  async deleteGoal(c: Context) {
    try {
      const { prismaClient, workosUserId } = getTenantPrismaFromContext(c);
      const body = await c.req.json();
      const validated = deleteGoalSchema.safeParse(body);

      if (!validated.success) {
        return c.json({ error: z.treeifyError(validated.error) }, 400);
      }

      const goal = await this.goalService.deleteGoal(prismaClient, workosUserId, validated.data.id);
      if (!goal) {
        return c.json({ message: "Goal not found" }, 404);
      }
      return c.json({ message: "Goal deleted successfully", data: goal }, 200);
    } catch (error) {
      if (error instanceof Error && error.message === "GOAL_HAS_TRANSACTIONS") {
        return c.json({ message: "Goal has linked transactions and cannot be deleted" }, 409);
      }
      return c.json({ message: "Error deleting Goal" }, 500);
    }
  }
}
