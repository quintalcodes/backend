import "dotenv/config";
import { defineConfig } from "prisma/config";

// Dedicated config for registry database migrations as we only need one registry database.
// use the prisma/tenant/prisma.config.ts for tenant database migrations.
export default defineConfig({
  schema: "prisma/registry/schema.prisma",
  datasource: {
    url: process.env.REGISTRY_DATABASE_URL ?? "postgresql://localhost/placeholder",
  },
});
