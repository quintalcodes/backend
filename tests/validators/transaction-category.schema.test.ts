import { describe, expect, test } from "bun:test";
import {
  createTransactionCategorySchema,
  deleteTransactionCategorySchema,
  updateTransactionCategorySchema,
} from "../../src/validators/transaction-category.schema";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("createTransactionCategorySchema", () => {
  test("accepts valid payload (name only)", () => {
    const result = createTransactionCategorySchema.safeParse({
      name: "Food",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Food");
      expect(result.data.description).toBeUndefined();
    }
  });

  test("accepts optional description", () => {
    const result = createTransactionCategorySchema.safeParse({
      name: "Bills",
      description: "Utilities and rent",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Utilities and rent");
    }
  });

  test("accepts null description", () => {
    const result = createTransactionCategorySchema.safeParse({
      name: "Other",
      description: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
    }
  });

  test("rejects empty name", () => {
    const result = createTransactionCategorySchema.safeParse({
      name: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateTransactionCategorySchema", () => {
  test("accepts partial payload with id", () => {
    const result = updateTransactionCategorySchema.safeParse({
      id: UUID,
      name: "Renamed",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
      expect(result.data.name).toBe("Renamed");
      expect(result.data.description).toBeUndefined();
    }
  });

  test("requires id", () => {
    const result = updateTransactionCategorySchema.safeParse({ name: "Only name" });
    expect(result.success).toBe(false);
  });

  test("rejects invalid id", () => {
    const result = updateTransactionCategorySchema.safeParse({ id: "", name: "x" });
    expect(result.success).toBe(false);
  });
});

describe("deleteTransactionCategorySchema", () => {
  test("accepts valid id", () => {
    const result = deleteTransactionCategorySchema.safeParse({ id: UUID });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
    }
  });

  test("rejects missing id", () => {
    const result = deleteTransactionCategorySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test("rejects empty id", () => {
    const result = deleteTransactionCategorySchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
