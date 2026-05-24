import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

//TODO: The generation of the database should be set behind payment service, once approved we generate workOS org and admin user dynamically through the workOS API.

const IP = "localhost";
// Change these values to your own. Run the script to add a new tenant to the database.
const adminUrl = `postgresql://postgres:postgres@${IP}:5433/postgres`;
const registryUrl = `postgresql://postgres:postgres@${IP}:5433/registry`;
const tenantDbName = "cafe_brown";
const tenantName = "Cafe Brown";
const tenantSubdomain = "cafe-brown";
const workosOrgId = "org_01KNG52GR7G2FJ9BQBEPZXY993";

const tenantUrl = `postgresql://postgres:postgres@${IP}:5433/${tenantDbName}`;
const projectRoot = fileURLToPath(new URL("../", import.meta.url));

// Tentant Owner values. Very important; this should reference back to the VenueLog Account owner, and assure the user has owner role in WorkOS.
// This is the method we use to assure only this user can create companies or venues.
const tenantOwnerEmail = "squintal@gmail.com";
const tenantOwnerName = "Sam";
const tenantOwnerLastName = "Quintal";
// WorkOS UserId
const authId = "user_01KNG5TZ6RX4KQX9ZAQ4BMDH6Y";

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

const companySystemRoles = [
  { name: "Owner", sortOrder: 1 },
  { name: "Admin", sortOrder: 2 },
  { name: "Venue Manager", sortOrder: 3 },
  { name: "Supervisor", sortOrder: 4 },
  { name: "Team Member", sortOrder: 5 },
] as const;

const venueSystemRoles = [
  { name: "Owner", sortOrder: 1 },
  { name: "Admin", sortOrder: 2 },
  { name: "Venue Manager", sortOrder: 3 },
  { name: "Supervisor", sortOrder: 4 },
  { name: "Team Member", sortOrder: 5 },
] as const;

type SeededRole = { id: string; name: string; sortOrder: number };
type SystemRole = { name: string; sortOrder: number };

async function upsertSystemRoles(
  client: Client,
  tableName: "company_roles" | "venue_roles",
  roles: readonly SystemRole[],
): Promise<SeededRole[]> {
  const roleResults: SeededRole[] = [];

  for (const role of roles) {
    const result = await client.query<{ id: string; name: string; sort_order: number }>(
      `
        WITH updated_role AS (
          UPDATE "${tableName}"
          SET
            "sort_order" = $2,
            "is_system_role" = true,
            "updated_at" = NOW()
          WHERE "name" = $1
          RETURNING "id", "name", "sort_order"
        ),
        inserted_role AS (
          INSERT INTO "${tableName}" ("id", "name", "is_system_role", "sort_order", "created_at", "updated_at")
          SELECT $3, $1, true, $2, NOW(), NOW()
          WHERE NOT EXISTS (SELECT 1 FROM updated_role)
          RETURNING "id", "name", "sort_order"
        )
        SELECT "id", "name", "sort_order" FROM updated_role
        UNION ALL
        SELECT "id", "name", "sort_order" FROM inserted_role
      `,
      [role.name, role.sortOrder, randomUUID()],
    );

    if (result.rows[0]) {
      roleResults.push({
        id: result.rows[0].id,
        name: result.rows[0].name,
        sortOrder: result.rows[0].sort_order,
      });
    }
  }

  return roleResults;
}

async function seedCompanyRoles() {
  const tenantClient = new Client({ connectionString: tenantUrl });

  await tenantClient.connect();
  try {
    return await upsertSystemRoles(tenantClient, "company_roles", companySystemRoles);
  } finally {
    await tenantClient.end();
  }
}

async function seedVenueRoles() {
  const tenantClient = new Client({ connectionString: tenantUrl });

  await tenantClient.connect();
  try {
    return await upsertSystemRoles(tenantClient, "venue_roles", venueSystemRoles);
  } finally {
    await tenantClient.end();
  }
}

async function seedTenantOwner() {
  const tenantClient = new Client({ connectionString: tenantUrl });

  await tenantClient.connect();
  try {
    await tenantClient.query(
      `
        INSERT INTO "users" ("id", "auth_id", "email", "first_name", "last_name", "is_verified", "is_active", "status", "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, true, true, 'active', NOW(), NOW())
        ON CONFLICT ("auth_id")
        DO UPDATE SET
          "email" = EXCLUDED."email",
          "first_name" = EXCLUDED."first_name",
          "last_name" = EXCLUDED."last_name",
          "updated_at" = NOW()
      `,
      [randomUUID(), authId, tenantOwnerEmail, tenantOwnerName, tenantOwnerLastName],
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

  const companyRoles = await seedCompanyRoles();
  const venueRoles = await seedVenueRoles();
  const tenantOwner = await seedTenantOwner();

  console.log("Company roles:", companyRoles);
  console.log("Venue roles:", venueRoles);
  console.log("Tenant owner:", tenantOwner);

  console.log(`Bootstrapped registry and tenant database ${tenantDbName} for ${tenantName}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
