import { Context } from "hono";
import { PrismaClient } from "../generated/prisma/client";
interface ContextClient {
  authId: string;
  prismaClient: PrismaClient;
}
/**
 * used on every request to get the authenticated user's Prisma client.
 * this auth context data is set in the auth middleware.
 * @param c - the Hono context.
 * @returns the authenticated user's Prisma client and AuthID for the user making the request.
 */
export function getTenantPrismaFromContext(c: Context): ContextClient {
  const authId = c.get("auth")?.userId;
  const prismaClient = c.get("tenantPrisma");

  if (!authId || !prismaClient) {
    throw new Error("User ID and Prisma client are required");
  }

  return { authId, prismaClient };
}
