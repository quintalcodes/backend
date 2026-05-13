import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const tenantClients = new Map<string, PrismaClient>();

export function tenantDatabaseUrlForDbName(dbName: string): string {
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error("Invalid database name");
  }

  const template = Bun.env.TENANT_DATABASE_URL;

  if (!template) {
    throw new Error("TENANT_DATABASE_URL is required");
  }

  const url = new URL(template);
  url.pathname = `/${dbName}`;
  return url.toString();
}

/**
 * getTenantPrismaForDbName
 * @description returns a Prisma client for the given database name.
 * @param dbName - the name of the database to get the Prisma client for.
 * @returns a Prisma client for the given database name.
 */
export function getTenantPrismaForDbName(dbName: string): PrismaClient {
  let client = tenantClients.get(dbName);

  if (!client) {
    const url = tenantDatabaseUrlForDbName(dbName);
    const adapter = new PrismaPg(url);
    // TODO: Switch to pool based connection
    client = new PrismaClient({ adapter });
    tenantClients.set(dbName, client);
  }

  return client;
}
