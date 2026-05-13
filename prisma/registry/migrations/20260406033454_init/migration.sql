-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "workosOrgId" TEXT NOT NULL,
    "subdomain" TEXT,
    "name" TEXT NOT NULL,
    "dbName" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_workosOrgId_key" ON "Tenant"("workosOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_dbName_key" ON "Tenant"("dbName");
