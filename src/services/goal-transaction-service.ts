import { PrismaClient } from "../generated/prisma/client";
import type {
  CreateGoalTransactionInput,
  UpdateGoalTransactionInput,
} from "../validators/goal-transaction.schema";

export class GoalTransactionService {
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

  async createGoalTransaction(
    prisma: PrismaClient,
    workosUserId: string,
    data: CreateGoalTransactionInput,
  ) {
    const userId = await this.resolveUserId(prisma, workosUserId);
    const goal = await prisma.goal.findFirst({
      where: { id: data.goalId, userId },
    });
    if (!goal) {
      throw new Error("Goal not found");
    }
    return prisma.goalTransaction.create({
      data: {
        userId,
        goalId: data.goalId,
        amount: data.amount ?? 0,
        date: data.date,
      },
    });
  }

  async getGoalTransactions(prisma: PrismaClient) {
    return prisma.goalTransaction.findMany({
      orderBy: { date: "desc" },
    });
  }

  async getGoalTransactionById(prisma: PrismaClient, id: string) {
    return prisma.goalTransaction.findFirst({
      where: { id },
    });
  }

  async updateGoalTransaction(prisma: PrismaClient, data: UpdateGoalTransactionInput) {
    const { id, ...rest } = data;
    const existing = await prisma.goalTransaction.findFirst({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    if (rest.goalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: rest.goalId },
      });
      if (!goal) {
        throw new Error("Goal not found");
      }
    }
    return prisma.goalTransaction.update({
      where: { id },
      data: rest,
    });
  }

  async deleteGoalTransaction(prisma: PrismaClient, id: string) {
    const existing = await prisma.goalTransaction.findFirst({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    return prisma.goalTransaction.delete({
      where: { id },
    });
  }
}
