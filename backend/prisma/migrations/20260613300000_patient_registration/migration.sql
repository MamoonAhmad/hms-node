-- Patient registration workflow fields and related tables

ALTER TABLE "patients" ADD COLUMN "registrationStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "patients" ADD COLUMN "registrationChannel" TEXT;
ALTER TABLE "patients" ADD COLUMN "billingType" TEXT;
ALTER TABLE "patients" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "patients" ADD COLUMN "primaryCareProviderId" TEXT;
ALTER TABLE "patients" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "patients" ADD COLUMN "consentFormSigned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "patients" ADD COLUMN "createdBy" TEXT;
ALTER TABLE "patients" ADD COLUMN "updatedBy" TEXT;
ALTER TABLE "patients" ADD COLUMN "deletedBy" TEXT;

CREATE INDEX "patients_registrationStatus_idx" ON "patients"("registrationStatus");
CREATE INDEX "patients_assignedToId_idx" ON "patients"("assignedToId");
CREATE INDEX "patients_deletedAt_idx" ON "patients"("deletedAt");
CREATE INDEX "patients_createdAt_idx" ON "patients"("createdAt");

ALTER TABLE "patients"
  ADD CONSTRAINT "patients_primaryCareProviderId_fkey"
  FOREIGN KEY ("primaryCareProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "patients"
  ADD CONSTRAINT "patients_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "patients"
  ADD CONSTRAINT "patients_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "patients"
  ADD CONSTRAINT "patients_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "patients"
  ADD CONSTRAINT "patients_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "patient_insurances" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "insuranceType" TEXT NOT NULL,
    "insuranceProviderId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "policyType" TEXT,
    "planName" TEXT,
    "groupNumber" TEXT,
    "subscriberFirstName" TEXT,
    "subscriberLastName" TEXT,
    "subscriberRelationship" TEXT,
    "subscriberGender" TEXT,
    "subscriberDateOfBirth" TIMESTAMP(3),
    "subscriberPhone" TEXT,
    "subscriberEmail" TEXT,
    "subscriberSsnLast4" TEXT,
    "subscriberEmployer" TEXT,
    "subscriberStreetAddress" TEXT,
    "subscriberCity" TEXT,
    "subscriberState" TEXT,
    "subscriberZip" TEXT,
    "coverageStartDate" DATE,
    "coverageEndDate" DATE,
    "coinsurancePercentage" DECIMAL(5,2),
    "copay" DECIMAL(10,2),
    "deductible" DECIMAL(10,2),
    "authorizationNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_insurances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "patient_insurances_patientId_insuranceType_key"
  ON "patient_insurances"("patientId", "insuranceType");

CREATE INDEX "patient_insurances_patientId_idx" ON "patient_insurances"("patientId");
CREATE INDEX "patient_insurances_insuranceProviderId_idx" ON "patient_insurances"("insuranceProviderId");

ALTER TABLE "patient_insurances"
  ADD CONSTRAINT "patient_insurances_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patient_insurances"
  ADD CONSTRAINT "patient_insurances_insuranceProviderId_fkey"
  FOREIGN KEY ("insuranceProviderId") REFERENCES "insurance_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "patient_documents" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT,
    "fileData" TEXT,
    "mimeType" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "patient_documents_patientId_idx" ON "patient_documents"("patientId");
CREATE INDEX "patient_documents_documentType_idx" ON "patient_documents"("documentType");

ALTER TABLE "patient_documents"
  ADD CONSTRAINT "patient_documents_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "patient_consent_signatures" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consentFormId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedByUserId" TEXT,
    "signatureType" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "scrolledToEnd" BOOLEAN NOT NULL DEFAULT false,
    "nameMatched" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "patient_consent_signatures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "patient_consent_signatures_patientId_consentFormId_key"
  ON "patient_consent_signatures"("patientId", "consentFormId");

CREATE INDEX "patient_consent_signatures_patientId_idx" ON "patient_consent_signatures"("patientId");

ALTER TABLE "patient_consent_signatures"
  ADD CONSTRAINT "patient_consent_signatures_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patient_consent_signatures"
  ADD CONSTRAINT "patient_consent_signatures_consentFormId_fkey"
  FOREIGN KEY ("consentFormId") REFERENCES "consent_forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_consent_signatures"
  ADD CONSTRAINT "patient_consent_signatures_signedByUserId_fkey"
  FOREIGN KEY ("signedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill existing patients as completed registrations
UPDATE "patients" SET "registrationStatus" = 'completed' WHERE "registrationStatus" = 'pending';
