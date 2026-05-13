import { describe, expect, test } from "bun:test";
import {
  createTransactionSchema,
  deleteTransactionSchema,
  updateTransactionSchema,
} from "../../src/validators/transaction.schema";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const ACCOUNT_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("createTransactionSchema", () => {
  test("accepts valid payload (required fields)", () => {
    const result = createTransactionSchema.safeParse({
      accountId: ACCOUNT_ID,
      kind: "expense",
      date: "2026-04-18T12:00:00.000Z",
      description: "Weekly shop",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountId).toBe(ACCOUNT_ID);
      expect(result.data.kind).toBe("expense");
      expect(result.data.description).toBe("Weekly shop");
      expect(result.data.date).toBeInstanceOf(Date);
      expect(result.data.amount).toBeUndefined();
      expect(result.data.transactionCategoryId).toBeUndefined();
    }
  });

  test("accepts optional fields", () => {
    const result = createTransactionSchema.safeParse({
      accountId: ACCOUNT_ID,
      kind: "expense",
      amount: 42.5,
      date: "2026-04-18T12:00:00.000Z",
      dueDate: "2026-04-20T00:00:00.000Z",
      description: "Rent",
      transactionCategoryId: UUID,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("expense");
      expect(result.data.amount).toBe(42.5);
      expect(result.data.dueDate).toBeInstanceOf(Date);
      expect(result.data.transactionCategoryId).toBe(UUID);
    }
  });

  test("accepts null dueDate", () => {
    const result = createTransactionSchema.safeParse({
      accountId: ACCOUNT_ID,
      kind: "income",
      date: "2026-04-18T12:00:00.000Z",
      dueDate: null,
      description: "Note",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dueDate).toBeNull();
    }
  });

  test("rejects empty accountId", () => {
    const result = createTransactionSchema.safeParse({
      accountId: "",
      kind: "expense",
      date: "2026-04-18T12:00:00.000Z",
      description: "y",
    });

    expect(result.success).toBe(false);
  });

  test("rejects invalid kind", () => {
    expect(
      createTransactionSchema.safeParse({
        accountId: ACCOUNT_ID,
        kind: "transfer",
        date: "2026-04-18T12:00:00.000Z",
        description: "y",
      }),
    ).toMatchObject({ success: false });
  });

  test("rejects non-number amount", () => {
    const result = createTransactionSchema.safeParse({
      accountId: ACCOUNT_ID,
      kind: "expense",
      date: "2026-04-18T12:00:00.000Z",
      description: "y",
      amount: "10" as unknown as number,
    });

    expect(result.success).toBe(false);
  });
});

describe("updateTransactionSchema", () => {
  test("accepts partial payload with id", () => {
    const result = updateTransactionSchema.safeParse({
      id: UUID,
      description: "Updated",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
      expect(result.data.description).toBe("Updated");
    }
  });

  test("requires id", () => {
    const result = updateTransactionSchema.safeParse({ description: "Only description" });
    expect(result.success).toBe(false);
  });

  test("rejects invalid id", () => {
    const result = updateTransactionSchema.safeParse({ id: "", description: "x" });
    expect(result.success).toBe(false);
  });

  test("rejects invalid kind when provided", () => {
    const result = updateTransactionSchema.safeParse({
      id: UUID,
      kind: "transfer",
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteTransactionSchema", () => {
  test("accepts valid id", () => {
    const result = deleteTransactionSchema.safeParse({ id: UUID });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
    }
  });

  test("rejects missing id", () => {
    const result = deleteTransactionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test("rejects empty id", () => {
    const result = deleteTransactionSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
