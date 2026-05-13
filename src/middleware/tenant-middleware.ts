import { createMiddleware } from "hono/factory";
import { getTenantPrismaForDbName } from "../lib/tenant-client";
import { RegistryService } from "../services/registry-service";
import type { Variables } from "../types/hono-env";

type TenantLookup = Pick<RegistryService, "getTenantByWorkosOrgId">;
type TenantClientFactory = typeof getTenantPrismaForDbName;

type TenantMiddlewareOptions = {
  registryService?: TenantLookup;
  getTenantPrisma?: TenantClientFactory;
};

const defaultRegistryService = new RegistryService();

export const createTenantMiddleware = ({
  registryService = defaultRegistryService,
  getTenantPrisma = getTenantPrismaForDbName,
}: TenantMiddlewareOptions = {}) =>
  createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const organizationId = c.get("auth")?.organizationId;

    if (!organizationId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let dbName: string;

    try {
      const tenant = await registryService.getTenantByWorkosOrgId(organizationId);
      dbName = tenant.dbName;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Tenant not found")) {
        return c.json({ error: "Forbidden" }, 403);
      }

      throw error;
    }

    // returns us the Prisma client for the authenticated user belonging to the tenant.
    const tenantPrisma = getTenantPrisma(dbName);
    c.set("tenantPrisma", tenantPrisma);
    await next();
  });

export const tenantMiddleware = createTenantMiddleware();
