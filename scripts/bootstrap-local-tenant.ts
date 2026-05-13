import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

//TODO: The generation of the database should be set behind payment service, once approved we generate workOS org and admin user dynamically through the workOS API.

const IP = "localhost";
// Change these values to your own. Run the script to add a new tenant to the database.
const adminUrl = `postgresql://postgres:postgres@${IP}:5433/postgres`;
const registryUrl = `postgresql://postgres:postgres@${IP}:5433/registry`;
const tenantDbName = "tenant_budgetflow_dev";
const tenantName = "Budgetflow Dev";
const tenantSubdomain = "budgetflow-dev";
const workosOrgId = "";
const tenantUrl = `postgresql://postgres:postgres@${IP}:5433/${tenantDbName}`;
const projectRoot = fileURLToPath(new URL("../", import.meta.url));

// Tentant Admin values. Quite important; take from workOS user profile.
const tenantAdminEmail = "squintal@gmail.com";
const tenantAdminName = "Sam";
const tenantAdminLastName = "Quintal";
const workOSUserId = "";

function assertSafeDatabaseName(name: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Invalid database name: ${name}`);
  }
}
async function ensureDatabase(client: Client, databaseName: string) {
  const existingDatabase = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
    databaseName,
  ]);

  if (existingDatabase.rowCount) {
    return;
  }

  await client.query(`CREATE DATABASE "${databaseName}"`);
}

function runPrismaMigrate(databaseUrl: string, schemaPath: string) {
  const result = spawnSync("bunx", ["prisma", "migrate", "deploy", `--schema=${schemaPath}`], {
    cwd: projectRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`Prisma migration failed for ${schemaPath}`);
  }
}

async function seedRegistry() {
  const registryClient = new Client({ connectionString: registryUrl });

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
    [randomUUID(), workosOrgId, tenantSubdomain, tenantName, tenantDbName, JSON.stringify({})],
  );
  await registryClient.end();
}

async function seedUserRoles() {
  const tenantClient = new Client({ connectionString: tenantUrl });
  await tenantClient.connect();
  const roleNames = ["owner", "user"] as const;

  const roleResults: Array<{ id: string; roleName: string }> = [];
  try {
    for (const roleName of roleNames) {
      const result = await tenantClient.query<{ id: string; roleName: string }>(
        `
        WITH updated_role AS (
          UPDATE "UserRole"
          SET "updatedAt" = NOW()
          WHERE "roleName" = $1
          RETURNING "id", "roleName"
        ),
        inserted_role AS (
          INSERT INTO "UserRole" ("id", "roleName", "createdAt", "updatedAt")
          SELECT $2, $1, NOW(), NOW()
          WHERE NOT EXISTS (SELECT 1 FROM updated_role)
          RETURNING "id", "roleName"
        )
        SELECT "id", "roleName" FROM updated_role
        UNION ALL
        SELECT "id", "roleName" FROM inserted_role
      `,
        [roleName, randomUUID()],
      );

      if (result.rows[0]) {
        roleResults.push(result.rows[0]);
      }
    }
  } finally {
    await tenantClient.end();
  }

  return roleResults;
}

async function seedTenantAdmin(ownerRole: { id: string; roleName: string }) {
  const tenantClient = new Client({ connectionString: tenantUrl });

  await tenantClient.connect();
  try {
    await tenantClient.query(
      `
      INSERT INTO "User" (
        "id",
        "workosUserId",
        "roleId",
        "email",
        "name",
        "lastName",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT ("email")
      DO UPDATE SET
        "workosUserId" = EXCLUDED."workosUserId",
        "roleId" = EXCLUDED."roleId",
        "name" = EXCLUDED."name",
        "lastName" = EXCLUDED."lastName",
        "updatedAt" = NOW()
    `,
      [
        randomUUID(),
        workOSUserId,
        ownerRole.id,
        tenantAdminEmail,
        tenantAdminName,
        tenantAdminLastName,
      ],
    );
  } finally {
    await tenantClient.end();
  }
}

async function main() {
  assertSafeDatabaseName("registry");
  assertSafeDatabaseName(tenantDbName);

  const adminClient = new Client({ connectionString: adminUrl });

  await adminClient.connect();
  await ensureDatabase(adminClient, "registry");
  await ensureDatabase(adminClient, tenantDbName);
  await adminClient.end();

  runPrismaMigrate(registryUrl, "prisma/registry/schema.prisma");
  runPrismaMigrate(tenantUrl, "prisma/tenant/schema.prisma");

  await seedRegistry();

  const roles = await seedUserRoles();
  const ownerRole = roles.find((role) => role.roleName === "owner");

  if (!ownerRole) {
    throw new Error("Owner role not found");
  }

  await seedTenantAdmin(ownerRole);

  console.log("Roles:", roles);

  console.log(`Bootstrapped registry and tenant database ${tenantDbName} for ${tenantName}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
