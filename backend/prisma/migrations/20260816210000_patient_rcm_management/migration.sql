-- Pure RCM Patient Management extensions

ALTER TABLE "patients"
  ADD COLUMN IF NOT EXISTS "collectionStatus" TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "collectionNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "guarantorId" TEXT,
  ADD COLUMN IF NOT EXISTS "mergedIntoId" TEXT;

CREATE INDEX IF NOT EXISTS "patients_guarantorId_idx" ON "patients"("guarantorId");
CREATE INDEX IF NOT EXISTS "patients_collectionStatus_idx" ON "patients"("collectionStatus");
CREATE INDEX IF NOT EXISTS "patients_mergedIntoId_idx" ON "patients"("mergedIntoId");

CREATE TABLE IF NOT EXISTS "guarantors" (
  "id" TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "middleName" TEXT,
  "relationship" TEXT DEFAULT 'self',
  "dateOfBirth" DATE,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "addressLine2" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zip" TEXT,
  "ssnLast4" TEXT,
  "employerName" TEXT,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "guarantors_lastName_firstName_idx" ON "guarantors"("lastName", "firstName");
CREATE INDEX IF NOT EXISTS "guarantors_isActive_idx" ON "guarantors"("isActive");

CREATE TABLE IF NOT EXISTS "payment_allocations" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "paymentTransactionId" TEXT NOT NULL,
  "chargeTransactionId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "payment_allocations_patientId_idx" ON "payment_allocations"("patientId");
CREATE INDEX IF NOT EXISTS "payment_allocations_paymentTransactionId_idx" ON "payment_allocations"("paymentTransactionId");
CREATE INDEX IF NOT EXISTS "payment_allocations_chargeTransactionId_idx" ON "payment_allocations"("chargeTransactionId");

CREATE TABLE IF NOT EXISTS "patient_merge_logs" (
  "id" TEXT PRIMARY KEY,
  "sourcePatientId" TEXT NOT NULL,
  "targetPatientId" TEXT NOT NULL,
  "summary" TEXT,
  "details" JSONB,
  "mergedBy" TEXT,
  "mergedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "patient_merge_logs_sourcePatientId_idx" ON "patient_merge_logs"("sourcePatientId");
CREATE INDEX IF NOT EXISTS "patient_merge_logs_targetPatientId_idx" ON "patient_merge_logs"("targetPatientId");
CREATE INDEX IF NOT EXISTS "patient_merge_logs_mergedAt_idx" ON "patient_merge_logs"("mergedAt");

ALTER TABLE "patient_statements"
  ADD COLUMN IF NOT EXISTS "deliveryChannel" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryError" TEXT;

ALTER TABLE "patient_insurances"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "cobOrder" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE INDEX IF NOT EXISTS "patient_insurances_isActive_idx" ON "patient_insurances"("isActive");

DO $$ BEGIN
  ALTER TABLE "patients" ADD CONSTRAINT "patients_guarantorId_fkey"
    FOREIGN KEY ("guarantorId") REFERENCES "guarantors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "patients" ADD CONSTRAINT "patients_mergedIntoId_fkey"
    FOREIGN KEY ("mergedIntoId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_paymentTransactionId_fkey"
    FOREIGN KEY ("paymentTransactionId") REFERENCES "ledger_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_chargeTransactionId_fkey"
    FOREIGN KEY ("chargeTransactionId") REFERENCES "ledger_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "patient_merge_logs" ADD CONSTRAINT "patient_merge_logs_sourcePatientId_fkey"
    FOREIGN KEY ("sourcePatientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "patient_merge_logs" ADD CONSTRAINT "patient_merge_logs_targetPatientId_fkey"
    FOREIGN KEY ("targetPatientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
