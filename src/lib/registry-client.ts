import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/registry/prisma/client";

let registry: PrismaClient | undefined;

/**
 * Returns a PrismaClient instance for the registry database. so we can find the db belonging to the user and organization
 * @returns PrismaClient instance for the registry database (shared schema across tenants)
 */
export function getRegistryPrisma() {
  if (registry) {
    return registry;
  }

  const registryDatabaseUrl = Bun.env.REGISTRY_DATABASE_URL;

  if (!registryDatabaseUrl) {
    throw new Error("REGISTRY_DATABASE_URL is required");
  }

  // TODO: Refactor so we don't create a bleed through effect here
  const adapter = new PrismaPg(registryDatabaseUrl);
  registry = new PrismaClient({ adapter });
  return registry;
}
