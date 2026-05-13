/**
 * Registry service
 * @description functions to interact with the registry database, for example: check which tenant a user belongs to.
 */

import { getRegistryPrisma } from "../lib/registry-client";

export class RegistryService {
  async getTenantByWorkosOrgId(workosOrgId: string) {
    const tenant = await getRegistryPrisma().tenant.findUnique({
      where: { workosOrgId },
      select: { dbName: true },
    });
    if (!tenant) {
      throw new Error(`Tenant not found: ${workosOrgId}`);
    }
    return tenant;
  }
}
