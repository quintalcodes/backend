import { Context } from "hono";
import { PrismaClient } from "../generated/prisma/client";
interface ContextClient {
  workosUserId: string;
  prismaClient: PrismaClient;
}
/**
 * used on every request to get the authenticated user's Prisma client.
 * @param c - the Hono context.
 * @returns the authenticated user's Prisma client.
 */
export function getTenantPrismaFromContext(c: Context): ContextClient {
  const workosUserId = c.get("auth")?.userId;
  const prismaClient = c.get("tenantPrisma");

  if (!workosUserId || !prismaClient) {
    throw new Error("User ID and Prisma client are required");
  }

  return { workosUserId, prismaClient };
}
