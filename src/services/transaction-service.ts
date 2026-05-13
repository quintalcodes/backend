import { PrismaClient } from "../generated/prisma/client";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "../validators/transaction.schema";

export class TransactionService {
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

  async createTransaction(
    prisma: PrismaClient,
    workosUserId: string,
    data: CreateTransactionInput,
  ) {
    const userId = await this.resolveUserId(prisma, workosUserId);
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId },
    });
    if (!account) {
      throw new Error("Account not found");
    }
    if (data.transactionCategoryId) {
      const category = await prisma.transactionCategory.findUnique({
        where: { id: data.transactionCategoryId },
      });
      if (!category) {
        throw new Error("Transaction category not found");
      }
    }
    return prisma.transaction.create({
      data: {
        userId,
        accountId: data.accountId,
        amount: data.amount ?? 0,
        kind: data.kind,
        date: data.date,
        dueDate: data.dueDate ?? undefined,
        description: data.description,
        transactionCategoryId: data.transactionCategoryId ?? undefined,
      },
    });
  }

  async getTransactions(prisma: PrismaClient) {
    return prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getTransactionById(prisma: PrismaClient, id: string) {
    return prisma.transaction.findFirst({
      where: { id },
    });
  }

  async updateTransaction(prisma: PrismaClient, data: UpdateTransactionInput) {
    const { id, ...rest } = data;
    const existing = await prisma.transaction.findFirst({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    if (rest.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: rest.accountId },
      });
      if (!account) {
        throw new Error("Account not found");
      }
    }
    if (rest.transactionCategoryId) {
      const category = await prisma.transactionCategory.findUnique({
        where: { id: rest.transactionCategoryId },
      });
      if (!category) {
        throw new Error("Transaction category not found");
      }
    }
    return prisma.transaction.update({
      where: { id },
      data: rest,
    });
  }

  async deleteTransaction(prisma: PrismaClient, id: string) {
    const existing = await prisma.transaction.findFirst({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    return prisma.transaction.delete({
      where: { id },
    });
  }
}
