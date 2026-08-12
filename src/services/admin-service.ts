import { getWorkOSClient } from "../lib/workos-client";
import { log } from "../utils/logger";
import { type CreateTenantInput } from "../validators/tenant.schema"; 

class AdminService {
  private workosClient = getWorkOSClient();

  async createTenant(tenantProps: CreateTenantInput) {
    try {
      const tenant = await this.workosClient.organizations.createOrganization({
        name: tenantProps.tenantName,
      });

      const inviteOwner = await this.workosClient.userManagement.sendInvitation({
        email: tenantProps.tenantOwnerEmail,
        organizationId: tenant.id,
        roleSlug: "owner",
      });

      return {
        tenant,
        inviteOwner,
      };
    } catch (error) {
      log.error("Error creating tenant.", error);
      throw error;
    }
  }

  async listTenants() {
    try {
      const tenants = await this.workosClient.organizations.listOrganizations();
      return tenants;
    } catch (error) {
      log.error("Error listing tenants.", error);
      throw error;
    }

  }
}

export const adminService = new AdminService();
