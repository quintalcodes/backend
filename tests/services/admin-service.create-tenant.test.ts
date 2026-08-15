import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";

const originalWorkOSApiKey = Bun.env.WORKOS_API_KEY;
const originalWorkOSClientId = Bun.env.WORKOS_CLIENT_ID;

Bun.env.WORKOS_API_KEY = originalWorkOSApiKey ?? "test-workos-api-key";
Bun.env.WORKOS_CLIENT_ID = originalWorkOSClientId ?? "test-workos-client-id";

const { adminService } = await import("../../src/services/admin-service");

if (originalWorkOSApiKey === undefined) {
  delete Bun.env.WORKOS_API_KEY;
} else {
  Bun.env.WORKOS_API_KEY = originalWorkOSApiKey;
}

if (originalWorkOSClientId === undefined) {
  delete Bun.env.WORKOS_CLIENT_ID;
} else {
  Bun.env.WORKOS_CLIENT_ID = originalWorkOSClientId;
}

const organization = {
  id: "org_123",
  name: "acme",
};

const invitation = {
  id: "invitation_123",
  email: "owner@acme.com",
};

const getOrganization = mock(async (_id: string) => organization);
const createOrganization = mock(async (_payload: { name: string }) => organization);

const sendInvitation = mock(
  async (_payload: { email: string; organizationId: string; roleSlug: string }) => invitation,
);

const fakeWorkOSClient = {
  organizations: {
    getOrganization,
    createOrganization,
    listOrganizations: mock(async () => []),
  },
  userManagement: {
    sendInvitation,
  },
};

const tenantInput = {
  tenantDbName: "acme",
  tenantName: "acme",
  tenantSubdomain: "acme",
  tenantOwnerEmail: "owner@acme.com",
  tenantOwnerFirstName: "ada",
  tenantOwnerLastName: "lovelace",
};

const originalWorkOSClient = Reflect.get(adminService, "workosClient");

beforeEach(() => {
  Reflect.set(adminService, "workosClient", fakeWorkOSClient);
  getOrganization.mockClear();
  createOrganization.mockClear();
  sendInvitation.mockClear();
});

afterEach(() => {
  Reflect.set(adminService, "workosClient", originalWorkOSClient);
  mock.restore();
});

describe("AdminService.createTenant", () => {
  it("should create a WorkOS organization for a new tenant", async () => {
    // Arrange
    spyOn(adminService, "findTenantRegistryEntry").mockResolvedValue(null);
    spyOn(adminService, "createTenantRegistry").mockResolvedValue({
      message: "Tenant added to registry successfully",
    });
    spyOn(adminService, "createTenantDatabase").mockResolvedValue({
      message: "Tenant database created successfully",
      prismaMigrate: { message: "Prisma migration completed successfully" },
    });

    // Act
    const result = await adminService.createTenant(tenantInput);

    // Assert
    expect({
      createOrganizationCalls: createOrganization.mock.calls,
      getOrganizationCalls: getOrganization.mock.calls,
      tenantId: result.tenant.id,
    }).toEqual({
      createOrganizationCalls: [[{ name: "acme" }]],
      getOrganizationCalls: [],
      tenantId: "org_123",
    });
  });

  it("should reuse the WorkOS organization for an existing tenant", async () => {
    // Arrange
    spyOn(adminService, "findTenantRegistryEntry").mockResolvedValue({
      workosOrgId: "org_existing",
    });
    spyOn(adminService, "createTenantRegistry").mockResolvedValue({
      message: "Tenant added to registry successfully",
    });
    spyOn(adminService, "createTenantDatabase").mockResolvedValue({
      message: "Tenant database created successfully",
      prismaMigrate: { message: "Prisma migration completed successfully" },
    });

    // Act
    const result = await adminService.createTenant(tenantInput);

    // Assert
    expect({
      getOrganizationCalls: getOrganization.mock.calls,
      createOrganizationCalls: createOrganization.mock.calls,
      tenantId: result.tenant.id,
    }).toEqual({
      getOrganizationCalls: [["org_existing"]],
      createOrganizationCalls: [],
      tenantId: "org_123",
    });
  });

  it("should invite the owner and provision the tenant resources", async () => {
    // Arrange
    const findTenantRegistryEntry = spyOn(
      adminService,
      "findTenantRegistryEntry",
    ).mockResolvedValue(null);
    const createTenantRegistry = spyOn(adminService, "createTenantRegistry").mockResolvedValue({
      message: "Tenant added to registry successfully",
    });
    const createTenantDatabase = spyOn(adminService, "createTenantDatabase").mockResolvedValue({
      message: "Tenant database created successfully",
      prismaMigrate: { message: "Prisma migration completed successfully" },
    });

    // Act
    const result = await adminService.createTenant(tenantInput);

    // Assert
    expect({
      registryLookupCalls: findTenantRegistryEntry.mock.calls,
      invitationCalls: sendInvitation.mock.calls,
      registryCreationCalls: createTenantRegistry.mock.calls,
      databaseCreationCalls: createTenantDatabase.mock.calls,
      result,
    }).toEqual({
      registryLookupCalls: [["acme"]],
      invitationCalls: [
        [
          {
            email: "owner@acme.com",
            organizationId: "org_123",
            roleSlug: "owner",
          },
        ],
      ],
      registryCreationCalls: [[organization, tenantInput]],
      databaseCreationCalls: [[tenantInput, invitation]],
      result: {
        tenant: organization,
        inviteOwner: invitation,
        addTenantToRegistry: {
          message: "Tenant added to registry successfully",
        },
        createTenantDatabase: {
          message: "Tenant database created successfully",
          prismaMigrate: {
            message: "Prisma migration completed successfully",
          },
        },
      },
    });
  });

  it("should stop provisioning when the registry lookup fails", async () => {
    // Arrange
    spyOn(adminService, "findTenantRegistryEntry").mockRejectedValue(
      new Error("Registry unavailable"),
    );
    let thrownError: unknown;

    // Act
    try {
      await adminService.createTenant(tenantInput);
    } catch (error) {
      thrownError = error;
    }

    // Assert
    expect({
      error: thrownError instanceof Error ? thrownError.message : null,
      getOrganizationCalls: getOrganization.mock.calls,
      createOrganizationCalls: createOrganization.mock.calls,
      invitationCalls: sendInvitation.mock.calls,
    }).toEqual({
      error: "Registry unavailable",
      getOrganizationCalls: [],
      createOrganizationCalls: [],
      invitationCalls: [],
    });
  });
});
