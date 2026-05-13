import { describe, expect, test } from "bun:test";
import {
  createAccountSchema,
  deleteAccountSchema,
  updateAccountSchema,
} from "../../src/validators/account.schema";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("createAccountSchema", () => {
  test("accepts valid payload (required fields only)", () => {
    const result = createAccountSchema.safeParse({
      name: "Checking",
      type: "checking",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Checking");
      expect(result.data.type).toBe("checking");
      expect(result.data.balance).toBeUndefined();
    }
  });

  test("accepts optional balance", () => {
    const result = createAccountSchema.safeParse({
      name: "Savings",
      type: "savings",
      balance: 100.5,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.balance).toBe(100.5);
    }
  });

  test("rejects empty name", () => {
    const result = createAccountSchema.safeParse({
      name: "",
      type: "checking",
    });

    expect(result.success).toBe(false);
  });

  test("rejects invalid account type", () => {
    expect(
      createAccountSchema.safeParse({
        name: "Bad",
        type: "not_a_valid_type",
      }),
    ).toMatchObject({ success: false });
  });

  test("rejects non-number balance", () => {
    const result = createAccountSchema.safeParse({
      name: "Ok",
      type: "cash",
      balance: "100" as unknown as number,
    });

    expect(result.success).toBe(false);
  });
});

describe("updateAccountSchema", () => {
  test("accepts partial payload with id", () => {
    const result = updateAccountSchema.safeParse({
      id: UUID,
      name: "Renamed",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
      expect(result.data.name).toBe("Renamed");
      expect(result.data.type).toBeUndefined();
    }
  });

  test("requires id", () => {
    const result = updateAccountSchema.safeParse({ name: "Only name" });
    expect(result.success).toBe(false);
  });

  test("rejects invalid id", () => {
    const result = updateAccountSchema.safeParse({ id: "", name: "My Account" });
    expect(result.success).toBe(false);
  });

  test("rejects invalid type when provided", () => {
    const result = updateAccountSchema.safeParse({
      id: UUID,
      type: "invalid_enum",
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteAccountSchema", () => {
  test("accepts valid id", () => {
    const result = deleteAccountSchema.safeParse({ id: UUID });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
    }
  });

  test("rejects missing id", () => {
    const result = deleteAccountSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test("rejects empty id", () => {
    const result = deleteAccountSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
