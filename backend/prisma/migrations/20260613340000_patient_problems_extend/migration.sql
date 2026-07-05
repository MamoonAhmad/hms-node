-- Extend patient_problems for full problem list management

ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "diagnosisId" TEXT;
ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

CREATE INDEX IF NOT EXISTS "patient_problems_isDeleted_idx" ON "patient_problems"("isDeleted");

DO $$ BEGIN
  ALTER TABLE "patient_problems"
    ADD CONSTRAINT "patient_problems_diagnosisId_fkey"
    FOREIGN KEY ("diagnosisId") REFERENCES "diagnosis_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "patient_problems"
    ADD CONSTRAINT "patient_problems_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "patient_problems"
    ADD CONSTRAINT "patient_problems_updatedBy_fkey"
    FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
