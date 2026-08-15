import { getWorkOSClient } from "../lib/workos-client";
import { log } from "../utils/logger";
import { type CreateTenantInput } from "../validators/tenant.schema";
import { Client } from "pg";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Invitation, Organization } from "@workos-inc/node";
import { spawn } from "bun";

class AdminService {
  private workosClient = getWorkOSClient();

  async createTenant(tenantProps: CreateTenantInput) {
    try {
      const existingEntry = await this.findTenantRegistryEntry(tenantProps.tenantDbName);

      const tenant = existingEntry
        ? await this.workosClient.organizations.getOrganization(existingEntry.workosOrgId)
        : await this.workosClient.organizations.createOrganization({
            name: tenantProps.tenantName,
          });

      const inviteOwner = await this.workosClient.userManagement.sendInvitation({
        email: tenantProps.tenantOwnerEmail,
        organizationId: tenant.id,
        roleSlug: "owner",
      });

      // Later version of this would wait for invitation to be accepted and payment approved before adding to registry and tenant database.
      const addTenantToRegistry = await this.createTenantRegistry(tenant, tenantProps);
      const createTenantDatabase = await this.createTenantDatabase(tenantProps, inviteOwner);

      return {
        tenant,
        inviteOwner,
        addTenantToRegistry,
        createTenantDatabase,
      };
    } catch (error) {
      log.error("Error creating tenant.", error);
      throw error;
    }
  }

  /**
   * Looks up an existing registry entry for a tenant database name, so
   * retries can reuse the WorkOS org that a prior attempt already created
   * instead of provisioning a duplicate.
   * @param dbName - The tenant database name.
   * @returns
   */
  async findTenantRegistryEntry(
    dbName: string,
  ): Promise<{ workosOrgId: string } | null> {
    const registryUrl = process.env.REGISTRY_DATABASE_URL;
    const registryClient = new Client({ connectionString: registryUrl });

    try {
      await registryClient.connect();

      const result = await registryClient.query<{ workosOrgId: string }>(
        `SELECT "workosOrgId" FROM "Tenant" WHERE "dbName" = $1`,
        [dbName],
      );

      return result.rows[0] ?? null;
    } catch (error) {
      log.error("Error looking up tenant registry entry.", error);
      throw error;
    } finally {
      await registryClient.end();
    }
  }

  /**
   * This function adds the workOS tenant to the registry database.
   * @param org - The organization created in WorkOS.
   * @param owner - The invitation sent to the tenant owner.
   * @returns
   */
  async createTenantRegistry(org: Organization, tenantProps: CreateTenantInput) {
    const registryUrl = process.env.REGISTRY_DATABASE_URL;
    const registryClient = new Client({ connectionString: registryUrl });

    try {
      await registryClient.connect();

      await registryClient.query(
        `
          INSERT INTO "Tenant" ("id", "workosOrgId", "subdomain", "name", "dbName", "config", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW(), NOW())
          ON CONFLICT ("workosOrgId")
          DO UPDATE SET
            "subdomain" = EXCLUDED."subdomain",
            "name" = EXCLUDED."name",
            "dbName" = EXCLUDED."dbName",
            "config" = EXCLUDED."config",
            "updatedAt" = NOW()
        `,
        [
          randomUUID(),
          org.id,
          tenantProps.tenantSubdomain,
          tenantProps.tenantName,
          tenantProps.tenantDbName,
          JSON.stringify({}),
        ],
      );

      return { message: "Tenant added to registry successfully" };
    } catch (error) {
      log.error("Error creating tenant registry.", error);
      throw error;
    } finally {
      await registryClient.end();
    }
  }

  /**
   * This function creates a new database for the tenant. It also adds the owner user to the database.
   * @param dbName - The name of the database to create.
   * @returns
   */
  async createTenantDatabase(tenantProps: CreateTenantInput, inviteOwner: Invitation) {
    const postgresBaseUrl = process.env.POSTGRES_BASE_URL;

    if (!postgresBaseUrl) {
      throw new Error("POSTGRES_BASE_URL is required");
    }

    const normalizedBaseUrl = postgresBaseUrl.replace(/\/$/, "");
    const adminClient = new Client({ connectionString: `${normalizedBaseUrl}/postgres` });
    const tenantDbString = `${normalizedBaseUrl}/${tenantProps.tenantDbName}`;

    try {
      try {
        await adminClient.connect();

        const existingDatabase = await adminClient.query(
          "SELECT 1 FROM pg_database WHERE datname = $1",
          [tenantProps.tenantDbName],
        );

        if (existingDatabase.rowCount) {
          log.info("Tenant database already exists, re-running migrations.", {
            tenantDbName: tenantProps.tenantDbName,
          });
        } else {
          await adminClient.query(
            `CREATE DATABASE ${adminClient.escapeIdentifier(tenantProps.tenantDbName)}`,
          );
        }
      } finally {
        await adminClient.end();
      }

      const prismaMigrate = await this.runPrismaMigrate(tenantDbString);

      const tenantClient = new Client({ connectionString: tenantDbString });
      try {
        await tenantClient.connect();

        await tenantClient.query(
          `
            INSERT INTO users (id, invitation_id, first_name, last_name, email, permission, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT (email)
            DO UPDATE SET
              invitation_id = EXCLUDED.invitation_id,
              first_name = EXCLUDED.first_name,
              last_name = EXCLUDED.last_name,
              permission = EXCLUDED.permission,
              status = EXCLUDED.status,
              updated_at = NOW()
          `,
          [
            randomUUID(),
            inviteOwner.id,
            tenantProps.tenantOwnerFirstName,
            tenantProps.tenantOwnerLastName,
            tenantProps.tenantOwnerEmail,
            "owner",
            "invited",
          ],
        );
      } catch (error) {
        log.error("Error adding user to tenant database.", error);
        throw error;
      } finally {
        await tenantClient.end();
      }

      return {
        message: "Tenant database created successfully",
        prismaMigrate,
      };
    } catch (error) {
      log.error("Error creating tenant database.", error);
      throw error;
    }
  }

  /**
   * Runs prisma migrate deploy for tenant database.
   * @param databaseUrl - The URL of the tenant database.
   * @returns {Promise<{ message: string }>} - A promise
   */
  async runPrismaMigrate(databaseUrl: string) {
    const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
    const schemaPath = "prisma/tenant/schema.prisma";
    const configPath = "prisma/tenant/prisma.config.ts";

    const proc = spawn(
      ["bunx", "prisma", "migrate", "deploy", `--schema=${schemaPath}`, `--config=${configPath}`],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
        stdout: "inherit",
        stderr: "inherit",
      },
    );

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      throw new Error(`Prisma migration failed for ${schemaPath}`);
    }

    return { message: "Prisma migration completed successfully" };
  }

  async listTenants() {
    try {
      const tenants = await this.workosClient.organizations.listOrganizations();
      return tenants;
    } catch (error) {
      log.error("Error listing tenants.", error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
