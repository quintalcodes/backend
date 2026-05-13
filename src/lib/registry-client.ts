import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/registry/prisma/client";

let registry: PrismaClient | undefined;

export function getRegistryPrisma() {
  if (registry) {
    return registry;
  }

  const registryDatabaseUrl = Bun.env.REGISTRY_DATABASE_URL;

  if (!registryDatabaseUrl) {
    throw new Error("REGISTRY_DATABASE_URL is required");
  }

  const adapter = new PrismaPg(registryDatabaseUrl);
  registry = new PrismaClient({ adapter });
  return registry;
}
