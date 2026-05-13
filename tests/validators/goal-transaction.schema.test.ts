import { describe, expect, test } from "bun:test";
import {
  createGoalTransactionSchema,
  deleteGoalTransactionSchema,
  updateGoalTransactionSchema,
} from "../../src/validators/goal-transaction.schema";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const GOAL_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("createGoalTransactionSchema", () => {
  test("accepts valid payload", () => {
    const result = createGoalTransactionSchema.safeParse({
      goalId: GOAL_ID,
      date: "2026-04-18T12:00:00.000Z",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goalId).toBe(GOAL_ID);
      expect(result.data.date).toBeInstanceOf(Date);
      expect(result.data.amount).toBeUndefined();
    }
  });

  test("accepts optional amount", () => {
    const result = createGoalTransactionSchema.safeParse({
      goalId: GOAL_ID,
      amount: 100.5,
      date: "2026-04-01T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(100.5);
    }
  });

  test("rejects empty goalId", () => {
    const result = createGoalTransactionSchema.safeParse({
      goalId: "",
      date: "2026-04-18T12:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateGoalTransactionSchema", () => {
  test("accepts partial payload with id", () => {
    const result = updateGoalTransactionSchema.safeParse({
      id: UUID,
      amount: 200,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
      expect(result.data.amount).toBe(200);
    }
  });

  test("requires id", () => {
    const result = updateGoalTransactionSchema.safeParse({ amount: 1 });
    expect(result.success).toBe(false);
  });
});

describe("deleteGoalTransactionSchema", () => {
  test("accepts valid id", () => {
    const result = deleteGoalTransactionSchema.safeParse({ id: UUID });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
    }
  });

  test("rejects empty id", () => {
    const result = deleteGoalTransactionSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
