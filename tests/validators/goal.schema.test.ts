import { describe, expect, test } from "bun:test";
import { createGoalSchema, deleteGoalSchema, updateGoalSchema } from "../../src/validators/goal.schema";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("createGoalSchema", () => {
  test("accepts valid payload (required fields)", () => {
    const result = createGoalSchema.safeParse({
      name: "Emergency fund",
      targetAmount: 5000,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Emergency fund");
      expect(result.data.targetAmount).toBe(5000);
      expect(result.data.status).toBeUndefined();
    }
  });

  test("accepts optional fields", () => {
    const result = createGoalSchema.safeParse({
      name: "Vacation",
      description: "Trip abroad",
      targetAmount: 3000,
      targetDate: "2026-12-31T00:00:00.000Z",
      category: "travel",
      status: "active",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Trip abroad");
      expect(result.data.targetDate).toBeInstanceOf(Date);
      expect(result.data.status).toBe("active");
    }
  });

  test("rejects empty name", () => {
    const result = createGoalSchema.safeParse({
      name: "",
      targetAmount: 1,
    });

    expect(result.success).toBe(false);
  });

  test("rejects invalid status", () => {
    expect(
      createGoalSchema.safeParse({
        name: "x",
        targetAmount: 1,
        status: "paused",
      }),
    ).toMatchObject({ success: false });
  });
});

describe("updateGoalSchema", () => {
  test("accepts partial payload with id", () => {
    const result = updateGoalSchema.safeParse({
      id: UUID,
      name: "Renamed goal",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
      expect(result.data.name).toBe("Renamed goal");
    }
  });

  test("requires id", () => {
    const result = updateGoalSchema.safeParse({ name: "Only name" });
    expect(result.success).toBe(false);
  });

  test("rejects invalid status when provided", () => {
    const result = updateGoalSchema.safeParse({
      id: UUID,
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteGoalSchema", () => {
  test("accepts valid id", () => {
    const result = deleteGoalSchema.safeParse({ id: UUID });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
    }
  });

  test("rejects empty id", () => {
    const result = deleteGoalSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
