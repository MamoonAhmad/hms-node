-- Enhance patient_problems with diagnosis link, audit fields, and soft delete

ALTER TABLE "patient_problems" RENAME COLUMN "problemCode" TO "icd10Code";
ALTER TABLE "patient_problems" RENAME COLUMN "problemDescription" TO "diagnosisDescription";
ALTER TABLE "patient_problems" RENAME COLUMN "verification" TO "verificationStatus";

ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "diagnosisId" TEXT;
ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

UPDATE "patient_problems"
SET
  "createdBy" = COALESCE("createdBy", (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1)),
  "updatedBy" = COALESCE("updatedBy", (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1))
WHERE "createdBy" IS NULL OR "updatedBy" IS NULL;

ALTER TABLE "patient_problems" ALTER COLUMN "createdBy" SET NOT NULL;
ALTER TABLE "patient_problems" ALTER COLUMN "updatedBy" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "patient_problems_diagnosisId_idx" ON "patient_problems"("diagnosisId");
CREATE INDEX IF NOT EXISTS "patient_problems_status_idx" ON "patient_problems"("status");
CREATE INDEX IF NOT EXISTS "patient_problems_deletedAt_idx" ON "patient_problems"("deletedAt");

ALTER TABLE "patient_problems" DROP CONSTRAINT IF EXISTS "patient_problems_diagnosisId_fkey";
ALTER TABLE "patient_problems" ADD CONSTRAINT "patient_problems_diagnosisId_fkey"
  FOREIGN KEY ("diagnosisId") REFERENCES "diagnosis_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "patient_problems" DROP CONSTRAINT IF EXISTS "patient_problems_createdBy_fkey";
ALTER TABLE "patient_problems" ADD CONSTRAINT "patient_problems_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_problems" DROP CONSTRAINT IF EXISTS "patient_problems_updatedBy_fkey";
ALTER TABLE "patient_problems" ADD CONSTRAINT "patient_problems_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_problems" DROP CONSTRAINT IF EXISTS "patient_problems_deletedBy_fkey";
ALTER TABLE "patient_problems" ADD CONSTRAINT "patient_problems_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
