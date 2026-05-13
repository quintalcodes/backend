import type { PrismaClient } from "../generated/prisma/client";

export type AuthenticatedActor = {
  userId: string;
  organizationId: string;
};

export type Variables = {
  auth: AuthenticatedActor;
  tenantPrisma: PrismaClient;
};
