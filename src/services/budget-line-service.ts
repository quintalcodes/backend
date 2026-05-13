import { PrismaClient } from "../generated/prisma/client";
import type { CreateBudgetLineInput, UpdateBudgetLineInput } from "../validators/budget-line.schema";

export class BudgetLineService {
  async createBudgetLine(prisma: PrismaClient, data: CreateBudgetLineInput) {
    return prisma.budgetLine.create({
      data: {
        budgetId: data.budgetId,
        transactionCategoryId: data.transactionCategoryId ?? undefined,
        categoryLabel: data.categoryLabel ?? undefined,
        amount: data.amount,
      },
    });
  }

  async getBudgetLines(prisma: PrismaClient) {
    return prisma.budgetLine.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getBudgetLineById(prisma: PrismaClient, id: string) {
    return prisma.budgetLine.findUnique({
      where: { id },
    });
  }

  async updateBudgetLine(prisma: PrismaClient, data: UpdateBudgetLineInput) {
    const { id, ...rest } = data;
    const existing = await prisma.budgetLine.findUnique({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    return prisma.budgetLine.update({
      where: { id },
      data: rest,
    });
  }

  async deleteBudgetLine(prisma: PrismaClient, id: string) {
    const existing = await prisma.budgetLine.findUnique({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    return prisma.budgetLine.delete({
      where: { id },
    });
  }
}
