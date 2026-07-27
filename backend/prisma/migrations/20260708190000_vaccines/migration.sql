-- CreateTable
CREATE TABLE "vaccines" (
    "id" TEXT NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "vaccineCode" TEXT NOT NULL,
    "manufacturer" TEXT,
    "route" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vaccines_vaccineCode_idx" ON "vaccines"("vaccineCode");

-- CreateIndex
CREATE INDEX "vaccines_vaccineName_idx" ON "vaccines"("vaccineName");

-- CreateIndex
CREATE INDEX "vaccines_manufacturer_idx" ON "vaccines"("manufacturer");

-- CreateIndex
CREATE INDEX "vaccines_route_idx" ON "vaccines"("route");

-- CreateIndex
CREATE INDEX "vaccines_status_idx" ON "vaccines"("status");

-- CreateIndex
CREATE INDEX "vaccines_createdAt_idx" ON "vaccines"("createdAt");

-- CreateIndex
CREATE INDEX "vaccines_deletedAt_idx" ON "vaccines"("deletedAt");

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
