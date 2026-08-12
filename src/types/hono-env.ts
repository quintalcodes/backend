import type { PrismaClient } from "../generated/prisma/client";

export type AuthenticatedActor = {
  userId: string;
  organizationId: string;
};

/**
 * The added context variables passed for tenant and auth context.
 * @auth: The authenticated with the userId and organizationId.
 * @tenantPrisma: The Prisma client for the tenant database.
**/

export type Variables = {
  auth: AuthenticatedActor;
  tenantPrisma: PrismaClient;
};
