import { describe, expect, test } from "bun:test";
import {
  createBudgetSchema,
  deleteBudgetSchema,
  updateBudgetSchema,
} from "../../src/validators/budget.schema";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("createBudgetSchema", () => {
  test("accepts valid payload (required period fields)", () => {
    const result = createBudgetSchema.safeParse({
      periodStart: "2026-01-01T00:00:00.000Z",
      periodEnd: "2026-01-31T23:59:59.000Z",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.periodStart).toBeInstanceOf(Date);
      expect(result.data.periodEnd).toBeInstanceOf(Date);
      expect(result.data.status).toBeUndefined();
    }
  });

  test("accepts optional fields", () => {
    const result = createBudgetSchema.safeParse({
      name: "Q1",
      periodStart: "2026-01-01T00:00:00.000Z",
      periodEnd: "2026-03-31T00:00:00.000Z",
      status: "active",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Q1");
      expect(result.data.status).toBe("active");
    }
  });

  test("rejects missing periodEnd", () => {
    const result = createBudgetSchema.safeParse({
      periodStart: "2026-01-01T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateBudgetSchema", () => {
  test("accepts partial payload with id", () => {
    const result = updateBudgetSchema.safeParse({
      id: UUID,
      name: "Renamed",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
      expect(result.data.name).toBe("Renamed");
    }
  });

  test("requires id", () => {
    const result = updateBudgetSchema.safeParse({ name: "Only name" });
    expect(result.success).toBe(false);
  });
});

describe("deleteBudgetSchema", () => {
  test("accepts valid id", () => {
    const result = deleteBudgetSchema.safeParse({ id: UUID });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
    }
  });

  test("rejects empty id", () => {
    const result = deleteBudgetSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
