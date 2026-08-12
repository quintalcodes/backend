import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/registry/schema.prisma",
  datasource: {
    url: process.env.REGISTRY_DATABASE_URL ?? "postgresql://localhost/placeholder",
  },
});
