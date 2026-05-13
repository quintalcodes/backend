import { PrismaClient } from "../generated/prisma/client";
import type { CreateGoalInput, UpdateGoalInput } from "../validators/goal.schema";

export class GoalService {
  private async resolveUserId(prisma: PrismaClient, workosUserId: string) {
    const user = await prisma.user.findUnique({
      where: { workosUserId },
      select: { id: true },
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user.id;
  }

  async createGoal(prisma: PrismaClient, workosUserId: string, data: CreateGoalInput) {
    const userId = await this.resolveUserId(prisma, workosUserId);
    return prisma.goal.create({
      data: {
        userId,
        name: data.name,
        description: data.description ?? undefined,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate ?? undefined,
        category: data.category ?? undefined,
        status: data.status ?? "active",
      },
    });
  }

  async getGoals(prisma: PrismaClient) {
    return prisma.goal.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getGoalById(prisma: PrismaClient, id: string) {
    return prisma.goal.findFirst({
      where: { id },
    });
  }

  async updateGoal(prisma: PrismaClient, data: UpdateGoalInput) {
    const { id, ...rest } = data;
    const existing = await prisma.goal.findFirst({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    return prisma.goal.update({
      where: { id },
      data: rest,
    });
  }

  async deleteGoal(prisma: PrismaClient, id: string) {
    const existing = await prisma.goal.findFirst({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    const linkedCount = await prisma.goalTransaction.count({
      where: { goalId: id },
    });
    if (linkedCount > 0) {
      throw new Error("GOAL_HAS_TRANSACTIONS");
    }
    return prisma.goal.delete({
      where: { id },
    });
  }
}
