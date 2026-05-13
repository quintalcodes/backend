import { PrismaClient } from "../generated/prisma/client";
import type { CreateBudgetInput, UpdateBudgetInput } from "../validators/budget.schema";

export class BudgetService {
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

  async createBudget(prisma: PrismaClient, workosUserId: string, data: CreateBudgetInput) {
    const userId = await this.resolveUserId(prisma, workosUserId);
    return prisma.budget.create({
      data: {
        userId,
        name: data.name ?? undefined,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        status: data.status ?? "active",
      },
      include: { lines: true },
    });
  }

  async getBudgetByDateRange(prisma: PrismaClient, startDate: Date, endDate: Date) {
    return prisma.budget.findMany({
      where: {
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate },
      },
      include: {
        lines: { include: { transactionCategory: { select: { name: true, description: true } } } },
      },
    });
  }

  async getBudgets(prisma: PrismaClient) {
    return prisma.budget.findMany({
      orderBy: { createdAt: "desc" },
      include: { lines: true },
    });
  }

  async getBudgetById(prisma: PrismaClient, id: string) {
    return prisma.budget.findFirst({
      where: { id },
      include: { lines: true },
    });
  }

  async updateBudget(prisma: PrismaClient, data: UpdateBudgetInput) {
    const { id, ...rest } = data;
    const existing = await prisma.budget.findFirst({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    return prisma.budget.update({
      where: { id },
      data: rest,
      include: { lines: true },
    });
  }

  async deleteBudget(prisma: PrismaClient, id: string) {
    const existing = await prisma.budget.findFirst({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    return prisma.budget.delete({
      where: { id },
    });
  }
}
