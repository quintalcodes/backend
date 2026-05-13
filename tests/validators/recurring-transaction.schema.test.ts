import { describe, expect, test } from "bun:test";
import {
  createRecurringTransactionSchema,
  deleteRecurringTransactionSchema,
  updateRecurringTransactionSchema,
} from "../../src/validators/recurring-transaction.schema";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const ACCOUNT_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("createRecurringTransactionSchema", () => {
  test("accepts valid payload", () => {
    const result = createRecurringTransactionSchema.safeParse({
      accountId: ACCOUNT_ID,
      description: "Rent",
      kind: "expense",
      recurringType: "monthly",
      startDate: "2026-04-01T00:00:00.000Z",
      transactionCategoryId: UUID,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountId).toBe(ACCOUNT_ID);
      expect(result.data.description).toBe("Rent");
      expect(result.data.kind).toBe("expense");
      expect(result.data.recurringType).toBe("monthly");
      expect(result.data.startDate).toBeInstanceOf(Date);
      expect(result.data.transactionCategoryId).toBe(UUID);
      expect(result.data.amount).toBeUndefined();
      expect(result.data.endDate).toBeUndefined();
    }
  });

  test("accepts optional fields", () => {
    const result = createRecurringTransactionSchema.safeParse({
      accountId: ACCOUNT_ID,
      description: "Subscription",
      kind: "expense",
      amount: 9.99,
      recurringType: "weekly",
      startDate: "2026-04-18T12:00:00.000Z",
      endDate: "2027-04-18T00:00:00.000Z",
      transactionCategoryId: UUID,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("expense");
      expect(result.data.amount).toBe(9.99);
      expect(result.data.endDate).toBeInstanceOf(Date);
      expect(result.data.transactionCategoryId).toBe(UUID);
    }
  });

  test("accepts null endDate", () => {
    const result = createRecurringTransactionSchema.safeParse({
      accountId: ACCOUNT_ID,
      description: "x",
      kind: "income",
      recurringType: "daily",
      startDate: "2026-04-18T12:00:00.000Z",
      endDate: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.endDate).toBeNull();
    }
  });

  test("rejects invalid recurringType", () => {
    expect(
      createRecurringTransactionSchema.safeParse({
        accountId: ACCOUNT_ID,
        description: "x",
        kind: "expense",
        recurringType: "hourly",
        startDate: "2026-04-18T12:00:00.000Z",
      }),
    ).toMatchObject({ success: false });
  });

  test("rejects invalid kind", () => {
    expect(
      createRecurringTransactionSchema.safeParse({
        accountId: ACCOUNT_ID,
        description: "x",
        kind: "transfer",
        recurringType: "monthly",
        startDate: "2026-04-18T12:00:00.000Z",
      }),
    ).toMatchObject({ success: false });
  });

  test("rejects empty description", () => {
    const result = createRecurringTransactionSchema.safeParse({
      accountId: ACCOUNT_ID,
      description: "",
      kind: "expense",
      recurringType: "yearly",
      startDate: "2026-04-18T12:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateRecurringTransactionSchema", () => {
  test("accepts partial payload with id", () => {
    const result = updateRecurringTransactionSchema.safeParse({
      id: UUID,
      amount: 50,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
      expect(result.data.amount).toBe(50);
    }
  });

  test("requires id", () => {
    const result = updateRecurringTransactionSchema.safeParse({ amount: 1 });
    expect(result.success).toBe(false);
  });

  test("rejects invalid recurringType when provided", () => {
    const result = updateRecurringTransactionSchema.safeParse({
      id: UUID,
      recurringType: "invalid",
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid kind when provided", () => {
    const result = updateRecurringTransactionSchema.safeParse({
      id: UUID,
      kind: "transfer",
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteRecurringTransactionSchema", () => {
  test("accepts valid id", () => {
    const result = deleteRecurringTransactionSchema.safeParse({ id: UUID });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
    }
  });

  test("rejects empty id", () => {
    const result = deleteRecurringTransactionSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
