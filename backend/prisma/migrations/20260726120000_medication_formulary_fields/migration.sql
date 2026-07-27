-- Medication Formulary clinical / coding / prescribing fields on medication_catalog
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "medicationType" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "therapeuticCategory" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "concentration" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "priorAuthorization" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "ageRestrictions" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "diagnosisRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "weightBasedDosing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "indications" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "contraindications" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "warnings" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "pregnancy" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "lactation" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "renalHepaticAdjustments" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "rxNorm" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "atc" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "snomedCt" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "hcpcs" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "formularyStatus" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "preferredDrug" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "alternativeMedication" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "drugMonograph" TEXT;
ALTER TABLE "medication_catalog" ADD COLUMN IF NOT EXISTS "patientLeaflet" TEXT;

CREATE INDEX IF NOT EXISTS "medication_catalog_therapeuticCategory_idx" ON "medication_catalog"("therapeuticCategory");
CREATE INDEX IF NOT EXISTS "medication_catalog_medicationType_idx" ON "medication_catalog"("medicationType");
CREATE INDEX IF NOT EXISTS "medication_catalog_formularyStatus_idx" ON "medication_catalog"("formularyStatus");
