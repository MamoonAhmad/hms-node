-- Medicines Master enhancements on medication_catalog
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "genericName" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "brandName" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "strengthUnit" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "route" JSONB;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "manufacturer" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "isControlledSubstance" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "controlledSubstanceSchedule" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "prescriptionRequired" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "defaultFrequency" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "defaultDose" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "defaultDoseUnit" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "defaultDuration" INTEGER;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "durationUnit" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "defaultQuantity" INTEGER;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "refillAllowed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "maximumRefills" INTEGER;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "effectiveDate" DATE;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "expiryDate" DATE;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

UPDATE "medication_catalog"
SET "genericName" = "name"
WHERE "genericName" IS NULL;

CREATE INDEX IF NOT EXISTS "medication_catalog_genericName_idx" ON "medication_catalog"("genericName");
CREATE INDEX IF NOT EXISTS "medication_catalog_brandName_idx" ON "medication_catalog"("brandName");
CREATE INDEX IF NOT EXISTS "medication_catalog_ndc_idx" ON "medication_catalog"("ndc");
CREATE INDEX IF NOT EXISTS "medication_catalog_dosageForm_idx" ON "medication_catalog"("dosageForm");
CREATE INDEX IF NOT EXISTS "medication_catalog_isControlledSubstance_idx" ON "medication_catalog"("isControlledSubstance");
CREATE INDEX IF NOT EXISTS "medication_catalog_prescriptionRequired_idx" ON "medication_catalog"("prescriptionRequired");
CREATE INDEX IF NOT EXISTS "medication_catalog_createdAt_idx" ON "medication_catalog"("createdAt");
CREATE INDEX IF NOT EXISTS "medication_catalog_updatedAt_idx" ON "medication_catalog"("updatedAt");

ALTER TABLE "medication_catalog" ADD CONSTRAINT "medication_catalog_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "medication_catalog" ADD CONSTRAINT "medication_catalog_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "medication_catalog" ADD CONSTRAINT "medication_catalog_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "medication_catalog_history" (
    "id" TEXT NOT NULL,
    "medicationCatalogId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT,
    "changes" JSONB,
    "changedBy" TEXT,
    "changedByName" TEXT,
    "changedByRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_catalog_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "medication_catalog_history_medicationCatalogId_idx" ON "medication_catalog_history"("medicationCatalogId");
CREATE INDEX IF NOT EXISTS "medication_catalog_history_createdAt_idx" ON "medication_catalog_history"("createdAt");

ALTER TABLE "medication_catalog_history" ADD CONSTRAINT "medication_catalog_history_medicationCatalogId_fkey" FOREIGN KEY ("medicationCatalogId") REFERENCES "medication_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
