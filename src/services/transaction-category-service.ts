import { PrismaClient } from "../generated/prisma/client";
import type {
  CreateTransactionCategoryInput,
  UpdateTransactionCategoryInput,
} from "../validators/transaction-category.schema";

export class TransactionCategoryService {
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

  async createTransactionCategory(
    prisma: PrismaClient,
    workosUserId: string,
    data: CreateTransactionCategoryInput,
  ) {
    return prisma.transactionCategory.create({
      data: {
        name: data.name,
        description: data.description ?? undefined,
      },
    });
  }

  async getTransactionCategories(prisma: PrismaClient) {
    return prisma.transactionCategory.findMany({
      orderBy: { name: "asc" },
    });
  }

  async getTransactionCategoryById(prisma: PrismaClient, id: string) {
    return prisma.transactionCategory.findUnique({
      where: { id },
    });
  }

  async updateTransactionCategory(prisma: PrismaClient, data: UpdateTransactionCategoryInput) {
    const { id, ...rest } = data;
    const existing = await prisma.transactionCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    return prisma.transactionCategory.update({
      where: { id },
      data: rest,
    });
  }

  async deleteTransactionCategory(prisma: PrismaClient, id: string) {
    const existing = await prisma.transactionCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    const inUseCount = await prisma.transaction.count({
      where: { transactionCategoryId: id },
    });
    if (inUseCount > 0) {
      throw new Error("TRANSACTION_CATEGORY_IN_USE");
    }
    return prisma.transactionCategory.delete({
      where: { id },
    });
  }
}
