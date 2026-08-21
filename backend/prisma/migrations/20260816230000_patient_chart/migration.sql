-- Patient chart status, statements, and claims

ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "chartStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "deceasedAt" TIMESTAMP(3);
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "financialClass" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "lastStatementAt" TIMESTAMP(3);
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "lastEligibilityAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "patients_chartStatus_idx" ON "patients"("chartStatus");

CREATE TABLE IF NOT EXISTS "patient_statements" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "statementNumber" TEXT NOT NULL,
    "periodFrom" DATE,
    "periodTo" DATE,
    "balance" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "notes" TEXT,
    "snapshot" JSONB,
    "generatedBy" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_statements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "patient_statements_statementNumber_key" ON "patient_statements"("statementNumber");
CREATE INDEX IF NOT EXISTS "patient_statements_patientId_idx" ON "patient_statements"("patientId");
CREATE INDEX IF NOT EXISTS "patient_statements_generatedAt_idx" ON "patient_statements"("generatedAt");
CREATE INDEX IF NOT EXISTS "patient_statements_status_idx" ON "patient_statements"("status");

ALTER TABLE "patient_statements"
  ADD CONSTRAINT "patient_statements_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "patient_claims" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "claimNumber" TEXT NOT NULL,
    "claimStatus" TEXT NOT NULL DEFAULT 'draft',
    "claimType" TEXT NOT NULL DEFAULT 'original',
    "payerName" TEXT,
    "memberId" TEXT,
    "billedAmount" DECIMAL(12,2),
    "paidAmount" DECIMAL(12,2),
    "patientResponsibility" DECIMAL(12,2),
    "denialReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_claims_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "patient_claims_patientId_idx" ON "patient_claims"("patientId");
CREATE INDEX IF NOT EXISTS "patient_claims_appointmentId_idx" ON "patient_claims"("appointmentId");
CREATE INDEX IF NOT EXISTS "patient_claims_claimStatus_idx" ON "patient_claims"("claimStatus");
CREATE INDEX IF NOT EXISTS "patient_claims_claimNumber_idx" ON "patient_claims"("claimNumber");

ALTER TABLE "patient_claims"
  ADD CONSTRAINT "patient_claims_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patient_claims"
  ADD CONSTRAINT "patient_claims_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
