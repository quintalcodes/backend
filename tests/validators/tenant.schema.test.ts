import { describe, expect, it } from "bun:test";
import { CreateTenantInput } from "../../src/validators/tenant.schema";

describe("CreateTenantInput", () => {
  it("should accept a valid payload unchanged", () => {
    // Arrange
    const input = {
      tenantDbName: "acme",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.parse(input);

    // Assert
    expect(result).toEqual({
      tenantDbName: "acme",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    });
  });

  it("should replace hyphens in the db name with underscores", () => {
    // Arrange
    const input = {
      tenantDbName: "acme-app",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.parse(input);

    // Assert
    expect(result.tenantDbName).toBe("acme_app");
  });

  it("should collapse spaces in the db name to underscores", () => {
    // Arrange
    const input = {
      tenantDbName: "acme app",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.parse(input);

    // Assert
    expect(result.tenantDbName).toBe("acme_app");
  });

  it("should lowercase mixed-case fields", () => {
    // Arrange
    const input = {
      tenantDbName: "Acme",
      tenantName: "Acme",
      tenantSubdomain: "Acme",
      tenantOwnerEmail: "Owner@Acme.COM",
      tenantOwnerFirstName: "Ada",
      tenantOwnerLastName: "Lovelace",
    };

    // Act
    const result = CreateTenantInput.parse(input);

    // Assert
    expect(result).toEqual({
      tenantDbName: "acme",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    });
  });

  it("should reject a payload with a missing tenant name", () => {
    // Arrange
    const input = {
      tenantDbName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an empty tenant name", () => {
    // Arrange
    const input = {
      tenantDbName: "acme",
      tenantName: "",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an invalid email", () => {
    // Arrange
    const input = {
      tenantDbName: "acme",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "not-an-email",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a db name longer than 63 characters", () => {
    // Arrange
    const input = {
      tenantDbName: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should accept a one-character db name", () => {
    // Arrange
    const input = {
      tenantDbName: "a",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.parse(input);

    // Assert
    expect(result.tenantDbName).toBe("a");
  });

  it("should accept a 63-character db name", () => {
    // Arrange
    const input = {
      tenantDbName: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.parse(input);

    // Assert
    expect(result.tenantDbName).toBe(
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
  });

  it("should reject a db name containing a dot", () => {
    // Arrange
    const input = {
      tenantDbName: "acme.db",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a db name containing a slash", () => {
    // Arrange
    const input = {
      tenantDbName: "acme/prod",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a db name containing a comma", () => {
    // Arrange
    const input = {
      tenantDbName: "acme,db",
      tenantName: "acme",
      tenantSubdomain: "acme",
      tenantOwnerEmail: "owner@acme.com",
      tenantOwnerFirstName: "ada",
      tenantOwnerLastName: "lovelace",
    };

    // Act
    const result = CreateTenantInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
