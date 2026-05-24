import { Context } from "hono";
import { PrismaClient } from "../generated/prisma/client";
interface ContextClient {
  authId: string;
  prismaClient: PrismaClient;
  organizationId: string;
}
/**
 * used on every request to get the authenticated user's Prisma client.
 * this auth context data is set in the auth middleware. we are also passing orgId, and the WorkOS User ID.
 * @param c - the Hono context.
 * @returns Prisma client, organization ID, and the authenticated user's AuthID.
 */
export function getTenantPrismaFromContext(c: Context): ContextClient {
  const authId = c.get("auth")?.userId;
  const organizationId = c.get("auth")?.organizationId;
  const prismaClient = c.get("tenantPrisma");

  if (!authId || !prismaClient) {
    throw new Error("User ID and Prisma client are required");
  }

  return { authId, prismaClient, organizationId };
}
