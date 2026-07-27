-- Patient problem clinical typing
ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "problemType" TEXT;
ALTER TABLE "patient_problems" ADD COLUMN IF NOT EXISTS "acuity" TEXT;

-- Visit-scoped encounter problems
CREATE TABLE IF NOT EXISTS "encounter_problems" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "addressedThisVisit" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER,
    "assessment" TEXT,
    "plan" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "encounter_problems_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "encounter_problems_appointmentId_problemId_key"
  ON "encounter_problems"("appointmentId", "problemId");
CREATE INDEX IF NOT EXISTS "encounter_problems_appointmentId_idx" ON "encounter_problems"("appointmentId");
CREATE INDEX IF NOT EXISTS "encounter_problems_patientId_idx" ON "encounter_problems"("patientId");
CREATE INDEX IF NOT EXISTS "encounter_problems_problemId_idx" ON "encounter_problems"("problemId");
CREATE INDEX IF NOT EXISTS "encounter_problems_addressedThisVisit_idx" ON "encounter_problems"("addressedThisVisit");

ALTER TABLE "encounter_problems" DROP CONSTRAINT IF EXISTS "encounter_problems_appointmentId_fkey";
ALTER TABLE "encounter_problems" ADD CONSTRAINT "encounter_problems_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "encounter_problems" DROP CONSTRAINT IF EXISTS "encounter_problems_patientId_fkey";
ALTER TABLE "encounter_problems" ADD CONSTRAINT "encounter_problems_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "encounter_problems" DROP CONSTRAINT IF EXISTS "encounter_problems_problemId_fkey";
ALTER TABLE "encounter_problems" ADD CONSTRAINT "encounter_problems_problemId_fkey"
  FOREIGN KEY ("problemId") REFERENCES "patient_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "encounter_problems" DROP CONSTRAINT IF EXISTS "encounter_problems_createdBy_fkey";
ALTER TABLE "encounter_problems" ADD CONSTRAINT "encounter_problems_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "encounter_problems" DROP CONSTRAINT IF EXISTS "encounter_problems_updatedBy_fkey";
ALTER TABLE "encounter_problems" ADD CONSTRAINT "encounter_problems_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Link coding diagnoses back to patient problems
ALTER TABLE "encounter_diagnoses" ADD COLUMN IF NOT EXISTS "problemId" TEXT;
CREATE INDEX IF NOT EXISTS "encounter_diagnoses_problemId_idx" ON "encounter_diagnoses"("problemId");

ALTER TABLE "encounter_diagnoses" DROP CONSTRAINT IF EXISTS "encounter_diagnoses_problemId_fkey";
ALTER TABLE "encounter_diagnoses" ADD CONSTRAINT "encounter_diagnoses_problemId_fkey"
  FOREIGN KEY ("problemId") REFERENCES "patient_problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
