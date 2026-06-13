-- CreateTable
CREATE TABLE "provider_block_hours" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "days" TEXT[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "effectiveStartDate" DATE NOT NULL,
    "effectiveEndDate" DATE,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_block_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_block_hours_providerId_idx" ON "provider_block_hours"("providerId");

-- CreateIndex
CREATE INDEX "provider_block_hours_deletedAt_idx" ON "provider_block_hours"("deletedAt");

-- AddForeignKey
ALTER TABLE "provider_block_hours" ADD CONSTRAINT "provider_block_hours_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
