import { endOfMonth, startOfDay, startOfMonth } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { PrismaClient } from "../generated/prisma/client";
import type {
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput,
} from "../validators/recurring-transaction.schema";

export class RecurringTransactionService {
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

  async createRecurringTransaction(
    prisma: PrismaClient,
    workosUserId: string,
    data: CreateRecurringTransactionInput,
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

    const startDateUtc = new TZDate(data.startDate, "UTC");
    const selectedMonthStartDate = startOfMonth(startDateUtc);
    const selectedMonthEndDate = startOfDay(endOfMonth(startDateUtc));

    return prisma.recurringTransaction.create({
      data: {
        accountId: data.accountId,
        userId,
        description: data.description,
        amount: data.amount ?? 0,
        kind: data.kind,
        recurringType: data.recurringType,
        startDate: selectedMonthStartDate,
        endDate: selectedMonthEndDate,
        transactionCategoryId: data.transactionCategoryId ?? undefined,
      },
    });
  }

  async getRecurringTransactions(prisma: PrismaClient) {
    return prisma.recurringTransaction.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getRecurringTransactionById(prisma: PrismaClient, id: string) {
    return prisma.recurringTransaction.findFirst({
      where: { id },
    });
  }

  async updateRecurringTransaction(prisma: PrismaClient, data: UpdateRecurringTransactionInput) {
    const { id, ...rest } = data;
    const existing = await prisma.recurringTransaction.findFirst({
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
    return prisma.recurringTransaction.update({
      where: { id },
      data: rest,
    });
  }

  async deleteRecurringTransaction(prisma: PrismaClient, id: string) {
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id },
    });
    if (!existing) {
      return null;
    }
    return prisma.recurringTransaction.delete({
      where: { id },
    });
  }
  async getRecurringTransactionsForPeriod(
    prisma: PrismaClient,
    periodStart: Date,
    periodEnd: Date,
  ) {
    return prisma.recurringTransaction.findMany({
      where: {
        startDate: { gte: periodStart },
        endDate: { lte: periodEnd },
      },
    });
  }
}
