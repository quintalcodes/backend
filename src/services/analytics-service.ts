import { PrismaClient } from "../generated/prisma/client";
import { BudgetService } from "./budget-service";
import { RecurringTransactionService } from "./recurring-transaction-service";

function utcStartOfCalendarDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function utcEndOfCalendarDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export class AnalyticsService {
  constructor(
    private readonly recurringTransactionService: RecurringTransactionService = new RecurringTransactionService(),
    private readonly budgetService: BudgetService = new BudgetService(),
  ) {}

  async getMonthlyBudgetSummary(PrismaClient: PrismaClient, periodStart: Date, periodEnd: Date) {
    const rangeStart = utcStartOfCalendarDay(periodStart);
    const rangeEnd = utcEndOfCalendarDay(periodEnd);
    const recurringTransactions =
      await this.recurringTransactionService.getRecurringTransactionsForPeriod(
        PrismaClient,
        rangeStart,
        rangeEnd,
      );

    const budget = await this.budgetService.getBudgetByDateRange(
      PrismaClient,
      rangeStart,
      rangeEnd,
    );

    const recurringIncome = recurringTransactions.filter(
      (transaction) => transaction.kind === "income",
    );
    const recurringExpenses = recurringTransactions.filter(
      (transaction) => transaction.kind === "expense",
    );

    const expensesByCategory = new Map<string, number>();

    for (const expense of recurringExpenses) {
      if (!expense.transactionCategoryId) continue;
      expensesByCategory.set(
        expense.transactionCategoryId,
        (expensesByCategory.get(expense.transactionCategoryId) ?? 0) + expense.amount,
      );
    }

    const budgets = budget.map((b) => ({
      ...b,
      lines: b.lines.map((line) => {
        const spent = line.transactionCategoryId
          ? (expensesByCategory.get(line.transactionCategoryId) ?? 0)
          : 0;
        return {
          ...line,
          spent,
          remaining: line.amount - spent,
        };
      }),
    }));

    const returnObject = {
      budgets,
      income: {
        total: recurringIncome.reduce(
          (runningTotal, transaction) => runningTotal + transaction.amount,
          0,
        ),
        transactions: recurringIncome,
      },
      expenses: {
        total: recurringExpenses.reduce(
          (runningTotal, transaction) => runningTotal + transaction.amount,
          0,
        ),
        transactions: recurringExpenses,
      },
    };

    return returnObject;
  }
}
