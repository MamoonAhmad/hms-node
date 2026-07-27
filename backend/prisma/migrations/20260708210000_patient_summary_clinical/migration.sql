-- Patient summary clinical data: allergies, problems, eligibility verification
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "noKnownDrugAllergies" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "patient_allergies" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "allergenName" TEXT NOT NULL,
    "reaction" TEXT,
    "severity" TEXT,
    "onsetDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_allergies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "patient_problems" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "problemCode" TEXT,
    "problemDescription" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "clinicalStatus" TEXT,
    "verification" TEXT,
    "onsetDate" DATE,
    "resolvedDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_problems_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "insurance_eligibility_verifications" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_eligibility_verifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "patient_allergies_patientId_idx" ON "patient_allergies"("patientId");
CREATE INDEX IF NOT EXISTS "patient_problems_patientId_idx" ON "patient_problems"("patientId");
CREATE INDEX IF NOT EXISTS "insurance_eligibility_verifications_patientId_idx" ON "insurance_eligibility_verifications"("patientId");
CREATE INDEX IF NOT EXISTS "insurance_eligibility_verifications_verifiedAt_idx" ON "insurance_eligibility_verifications"("verifiedAt");

ALTER TABLE "patient_allergies" DROP CONSTRAINT IF EXISTS "patient_allergies_patientId_fkey";
ALTER TABLE "patient_allergies" ADD CONSTRAINT "patient_allergies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patient_problems" DROP CONSTRAINT IF EXISTS "patient_problems_patientId_fkey";
ALTER TABLE "patient_problems" ADD CONSTRAINT "patient_problems_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "insurance_eligibility_verifications" DROP CONSTRAINT IF EXISTS "insurance_eligibility_verifications_patientId_fkey";
ALTER TABLE "insurance_eligibility_verifications" ADD CONSTRAINT "insurance_eligibility_verifications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
