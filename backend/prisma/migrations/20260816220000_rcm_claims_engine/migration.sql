-- RCM claims engine, EDI, ERA, denials, collections, statement cycles

ALTER TABLE "patient_claims"
  ADD COLUMN IF NOT EXISTS "formType" TEXT DEFAULT 'CMS-1500',
  ADD COLUMN IF NOT EXISTS "groupNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "billingProviderNpi" TEXT,
  ADD COLUMN IF NOT EXISTS "renderingProviderNpi" TEXT,
  ADD COLUMN IF NOT EXISTS "placeOfService" TEXT,
  ADD COLUMN IF NOT EXISTS "frequencyCode" TEXT DEFAULT '1',
  ADD COLUMN IF NOT EXISTS "allowedAmount" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "adjustmentAmount" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "denialCode" TEXT,
  ADD COLUMN IF NOT EXISTS "tcn" TEXT,
  ADD COLUMN IF NOT EXISTS "controlNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "scrubStatus" TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "scrubIssues" JSONB,
  ADD COLUMN IF NOT EXISTS "clearinghouseStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "formPayload" JSONB,
  ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

CREATE INDEX IF NOT EXISTS "patient_claims_tcn_idx" ON "patient_claims"("tcn");
CREATE INDEX IF NOT EXISTS "patient_claims_formType_idx" ON "patient_claims"("formType");

ALTER TABLE "procedures"
  ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "placeOfService" TEXT DEFAULT '11',
  ADD COLUMN IF NOT EXISTS "isBillable" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "claim_lines" (
  "id" TEXT PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "serviceDate" DATE,
  "cptCode" TEXT,
  "hcpcsCode" TEXT,
  "modifiers" TEXT,
  "diagnosisPointers" TEXT,
  "units" DECIMAL(10,2) NOT NULL DEFAULT 1,
  "unitCharge" DECIMAL(12,2) NOT NULL,
  "chargeAmount" DECIMAL(12,2) NOT NULL,
  "allowedAmount" DECIMAL(12,2),
  "paidAmount" DECIMAL(12,2),
  "placeOfService" TEXT,
  "revenueCode" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "claim_lines_claimId_idx" ON "claim_lines"("claimId");

CREATE TABLE IF NOT EXISTS "claim_events" (
  "id" TEXT PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "summary" TEXT,
  "details" JSONB,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "claim_events_claimId_idx" ON "claim_events"("claimId");

CREATE TABLE IF NOT EXISTS "encounter_billings" (
  "id" TEXT PRIMARY KEY,
  "appointmentId" TEXT NOT NULL UNIQUE,
  "patientId" TEXT NOT NULL,
  "billingStatus" TEXT NOT NULL DEFAULT 'Unbilled',
  "diagnoses" JSONB NOT NULL DEFAULT '[]',
  "charges" JSONB NOT NULL DEFAULT '[]',
  "payments" JSONB NOT NULL DEFAULT '[]',
  "followUpNotes" JSONB NOT NULL DEFAULT '[]',
  "auditTrail" JSONB NOT NULL DEFAULT '[]',
  "meta" JSONB,
  "claimId" TEXT,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "encounter_billings_patientId_idx" ON "encounter_billings"("patientId");
CREATE INDEX IF NOT EXISTS "encounter_billings_billingStatus_idx" ON "encounter_billings"("billingStatus");

CREATE TABLE IF NOT EXISTS "edi_transactions" (
  "id" TEXT PRIMARY KEY,
  "claimId" TEXT,
  "transactionType" TEXT NOT NULL,
  "direction" TEXT NOT NULL DEFAULT 'outbound',
  "controlNumber" TEXT,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "payload" JSONB,
  "responsePayload" JSONB,
  "errorMessage" TEXT,
  "providerName" TEXT DEFAULT 'mock-clearinghouse',
  "createdBy" TEXT,
  "sentAt" TIMESTAMP(3),
  "acknowledgedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "edi_transactions_claimId_idx" ON "edi_transactions"("claimId");
CREATE INDEX IF NOT EXISTS "edi_transactions_transactionType_idx" ON "edi_transactions"("transactionType");

CREATE TABLE IF NOT EXISTS "era_batches" (
  "id" TEXT PRIMARY KEY,
  "batchNumber" TEXT NOT NULL UNIQUE,
  "payerName" TEXT,
  "checkNumber" TEXT,
  "checkDate" DATE,
  "totalPayment" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'imported',
  "rawPayload" JSONB,
  "importedBy" TEXT,
  "postedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "era_lines" (
  "id" TEXT PRIMARY KEY,
  "eraBatchId" TEXT NOT NULL,
  "claimId" TEXT,
  "patientId" TEXT,
  "claimNumber" TEXT,
  "tcn" TEXT,
  "billedAmount" DECIMAL(12,2),
  "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "adjustmentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "patientResponsibility" DECIMAL(12,2),
  "denialCode" TEXT,
  "denialReason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "ledgerPaymentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "era_lines_eraBatchId_idx" ON "era_lines"("eraBatchId");
CREATE INDEX IF NOT EXISTS "era_lines_claimId_idx" ON "era_lines"("claimId");

CREATE TABLE IF NOT EXISTS "denial_cases" (
  "id" TEXT PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "denialCode" TEXT,
  "denialReason" TEXT,
  "carcCode" TEXT,
  "rarcCode" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "deniedAmount" DECIMAL(12,2),
  "assignedTo" TEXT,
  "dueDate" DATE,
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "denial_cases_claimId_idx" ON "denial_cases"("claimId");
CREATE INDEX IF NOT EXISTS "denial_cases_status_idx" ON "denial_cases"("status");

CREATE TABLE IF NOT EXISTS "appeal_cases" (
  "id" TEXT PRIMARY KEY,
  "denialId" TEXT NOT NULL,
  "claimId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "appealLevel" INTEGER NOT NULL DEFAULT 1,
  "reason" TEXT,
  "submittedAt" TIMESTAMP(3),
  "decisionAt" TIMESTAMP(3),
  "decision" TEXT,
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "appeal_cases_denialId_idx" ON "appeal_cases"("denialId");

CREATE TABLE IF NOT EXISTS "follow_up_tasks" (
  "id" TEXT PRIMARY KEY,
  "claimId" TEXT,
  "patientId" TEXT,
  "appointmentId" TEXT,
  "taskType" TEXT NOT NULL DEFAULT 'follow_up',
  "status" TEXT NOT NULL DEFAULT 'open',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "summary" TEXT,
  "notes" TEXT,
  "assignee" TEXT,
  "dueDate" DATE,
  "completedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "follow_up_tasks_status_idx" ON "follow_up_tasks"("status");

CREATE TABLE IF NOT EXISTS "statement_cycles" (
  "id" TEXT PRIMARY KEY,
  "cycleNumber" TEXT NOT NULL UNIQUE,
  "periodFrom" DATE,
  "periodTo" DATE,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "statementCount" INTEGER NOT NULL DEFAULT 0,
  "totalBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "deliveryChannel" TEXT DEFAULT 'email',
  "notes" TEXT,
  "createdBy" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "collection_accounts" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "agencyName" TEXT,
  "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "balanceAtPlacement" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "dunningLevel" INTEGER NOT NULL DEFAULT 1,
  "nextActionDate" DATE,
  "notes" TEXT,
  "closedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "collection_accounts_patientId_idx" ON "collection_accounts"("patientId");

DO $$ BEGIN ALTER TABLE "claim_lines" ADD CONSTRAINT "claim_lines_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "patient_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "claim_events" ADD CONSTRAINT "claim_events_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "patient_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "encounter_billings" ADD CONSTRAINT "encounter_billings_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "edi_transactions" ADD CONSTRAINT "edi_transactions_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "patient_claims"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "era_lines" ADD CONSTRAINT "era_lines_eraBatchId_fkey" FOREIGN KEY ("eraBatchId") REFERENCES "era_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "era_lines" ADD CONSTRAINT "era_lines_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "patient_claims"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "denial_cases" ADD CONSTRAINT "denial_cases_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "patient_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "appeal_cases" ADD CONSTRAINT "appeal_cases_denialId_fkey" FOREIGN KEY ("denialId") REFERENCES "denial_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "patient_claims"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
