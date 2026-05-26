import { describe, expect, test } from "bun:test";
import {
  createVenueSchema,
  deleteVenueSchema,
  updateVenueSchema,
} from "../../src/validators/venue.schema";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const COMPANY_ID = "154f4ec7-ba09-4648-ba12-14b75994d1a3";

describe("createVenueSchema", () => {
  test("accepts valid payload (required fields only)", () => {
    const result = createVenueSchema.safeParse({
      companyId: COMPANY_ID,
      name: "Cafe Brown Southbank",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.companyId).toBe(COMPANY_ID);
      expect(result.data.name).toBe("Cafe Brown Southbank");
      expect(result.data.status).toBeUndefined();
    }
  });

  test("accepts optional fields", () => {
    const result = createVenueSchema.safeParse({
      companyId: COMPANY_ID,
      name: "Cafe Brown Southbank",
      taxNumber: "12345678901",
      phone: "+0755322827",
      email: "southbank@cafebrown.com",
      website: "https://cafebrown.com/southbank",
      addressLine1: "123 Grey Street",
      city: "Brisbane",
      state: "Queensland",
      postcode: "4101",
      country: "AU",
      status: "active",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("southbank@cafebrown.com");
      expect(result.data.status).toBe("active");
    }
  });

  test("rejects missing companyId", () => {
    const result = createVenueSchema.safeParse({
      name: "Cafe Brown Southbank",
    });

    expect(result.success).toBe(false);
  });

  test("rejects empty companyId", () => {
    const result = createVenueSchema.safeParse({
      companyId: "",
      name: "Cafe Brown Southbank",
    });

    expect(result.success).toBe(false);
  });

  test("rejects empty name", () => {
    const result = createVenueSchema.safeParse({
      companyId: COMPANY_ID,
      name: "",
    });

    expect(result.success).toBe(false);
  });

  test("rejects invalid email", () => {
    const result = createVenueSchema.safeParse({
      companyId: COMPANY_ID,
      name: "Cafe Brown Southbank",
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  test("rejects invalid status", () => {
    const result = createVenueSchema.safeParse({
      companyId: COMPANY_ID,
      name: "Cafe Brown Southbank",
      status: "invalid_status",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateVenueSchema", () => {
  test("accepts partial payload with id", () => {
    const result = updateVenueSchema.safeParse({
      id: UUID,
      name: "Renamed Venue",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
      expect(result.data.name).toBe("Renamed Venue");
      expect(result.data.companyId).toBeUndefined();
    }
  });

  test("requires id", () => {
    const result = updateVenueSchema.safeParse({ name: "Only name" });
    expect(result.success).toBe(false);
  });

  test("rejects empty id", () => {
    const result = updateVenueSchema.safeParse({ id: "", name: "My Venue" });
    expect(result.success).toBe(false);
  });

  test("rejects invalid status when provided", () => {
    const result = updateVenueSchema.safeParse({
      id: UUID,
      status: "invalid_enum",
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteVenueSchema", () => {
  test("accepts valid id", () => {
    const result = deleteVenueSchema.safeParse({ id: UUID });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(UUID);
    }
  });

  test("rejects missing id", () => {
    const result = deleteVenueSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test("rejects empty id", () => {
    const result = deleteVenueSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
