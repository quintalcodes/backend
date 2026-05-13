import { describe, expect, test } from "bun:test";
import {
  createBudgetLineSchema,
  deleteBudgetLineSchema,
  updateBudgetLineSchema,
} from "../../src/validators/budget-line.schema";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const BUDGET_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("createBudgetLineSchema", () => {
  test("accepts valid payload", () => {
    const result = createBudgetLineSchema.safeParse({
      budgetId: BUDGET_ID,
      amount: 100,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.budgetId).toBe(BUDGET_ID);
      expect(result.data.amount).toBe(100);
    }
  });

  test("accepts optional category fields", () => {
    const result = createBudgetLineSchema.safeParse({
      budgetId: BUDGET_ID,
      transactionCategoryId: UUID,
      categoryLabel: "Groceries",
      amount: 250.5,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.transactionCategoryId).toBe(UUID);
      expect(result.data.categoryLabel).toBe("Groceries");
    }
  });

  test("rejects empty budgetId", () => {
    const result = createBudgetLineSchema.safeParse({
      budgetId: "",
      amount: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBudgetLineSchema", () => {
  test("accepts partial payload with id", () => {
    const result = updateBudgetLineSchema.safeParse({
      id: UUID,
      amount: 99,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
      expect(result.data.amount).toBe(99);
    }
  });

  test("requires id", () => {
    const result = updateBudgetLineSchema.safeParse({ amount: 1 });
    expect(result.success).toBe(false);
  });
});

describe("deleteBudgetLineSchema", () => {
  test("accepts valid id", () => {
    const result = deleteBudgetLineSchema.safeParse({ id: UUID });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
    }
  });

  test("rejects empty id", () => {
    const result = deleteBudgetLineSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
