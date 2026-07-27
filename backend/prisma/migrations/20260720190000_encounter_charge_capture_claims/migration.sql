-- Encounter charge capture (coding) + professional claims

CREATE TABLE "encounter_charge_captures" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "placeOfService" TEXT NOT NULL DEFAULT '11',
    "dateOfService" DATE NOT NULL,
    "renderingProviderId" TEXT,
    "renderingProviderNpi" TEXT,
    "renderingProviderName" TEXT,
    "billingProviderName" TEXT,
    "billingProviderNpi" TEXT,
    "billingProviderTaxId" TEXT,
    "authorizationNumber" TEXT,
    "referralNumber" TEXT,
    "notes" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lockedByName" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encounter_charge_captures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "encounter_diagnoses" (
    "id" TEXT NOT NULL,
    "chargeCaptureId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "icd10Code" TEXT NOT NULL,
    "description" TEXT,
    "diagnosisCodeId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encounter_diagnoses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "encounter_service_lines" (
    "id" TEXT NOT NULL,
    "chargeCaptureId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "serviceDate" DATE NOT NULL,
    "procedureCode" TEXT NOT NULL,
    "codeType" TEXT NOT NULL DEFAULT 'CPT',
    "description" TEXT,
    "modifier1" TEXT,
    "modifier2" TEXT,
    "modifier3" TEXT,
    "modifier4" TEXT,
    "units" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "chargeAmount" DECIMAL(10,2) NOT NULL,
    "diagnosisPointers" TEXT NOT NULL DEFAULT '1',
    "placeOfService" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encounter_service_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "chargeCaptureId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "claimType" TEXT NOT NULL DEFAULT 'original',
    "dateOfService" DATE NOT NULL,
    "placeOfService" TEXT NOT NULL DEFAULT '11',
    "totalCharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "patientFirstName" TEXT,
    "patientLastName" TEXT,
    "patientMrn" TEXT,
    "patientDateOfBirth" DATE,
    "patientGender" TEXT,
    "patientAddress" TEXT,
    "patientCity" TEXT,
    "patientState" TEXT,
    "patientZip" TEXT,
    "patientPhone" TEXT,
    "subscriberFirstName" TEXT,
    "subscriberLastName" TEXT,
    "subscriberMemberId" TEXT,
    "subscriberGroupNumber" TEXT,
    "subscriberRelationship" TEXT,
    "payerName" TEXT,
    "payerId" TEXT,
    "insuranceType" TEXT,
    "authorizationNumber" TEXT,
    "referralNumber" TEXT,
    "renderingProviderId" TEXT,
    "renderingProviderNpi" TEXT,
    "renderingProviderName" TEXT,
    "billingProviderName" TEXT,
    "billingProviderNpi" TEXT,
    "billingProviderTaxId" TEXT,
    "encounterNumber" TEXT,
    "notes" TEXT,
    "readyAt" TIMESTAMP(3),
    "readyBy" TEXT,
    "readyByName" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "submittedByName" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "claim_diagnoses" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "icd10Code" TEXT NOT NULL,
    "description" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_diagnoses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "claim_service_lines" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "serviceDate" DATE NOT NULL,
    "procedureCode" TEXT NOT NULL,
    "codeType" TEXT NOT NULL DEFAULT 'CPT',
    "description" TEXT,
    "modifier1" TEXT,
    "modifier2" TEXT,
    "modifier3" TEXT,
    "modifier4" TEXT,
    "units" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "chargeAmount" DECIMAL(10,2) NOT NULL,
    "diagnosisPointers" TEXT NOT NULL DEFAULT '1',
    "placeOfService" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_service_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "encounter_charge_captures_appointmentId_key" ON "encounter_charge_captures"("appointmentId");
CREATE INDEX "encounter_charge_captures_patientId_idx" ON "encounter_charge_captures"("patientId");
CREATE INDEX "encounter_charge_captures_status_idx" ON "encounter_charge_captures"("status");
CREATE INDEX "encounter_charge_captures_dateOfService_idx" ON "encounter_charge_captures"("dateOfService");

CREATE INDEX "encounter_diagnoses_chargeCaptureId_idx" ON "encounter_diagnoses"("chargeCaptureId");
CREATE INDEX "encounter_diagnoses_icd10Code_idx" ON "encounter_diagnoses"("icd10Code");
CREATE UNIQUE INDEX "encounter_diagnoses_chargeCaptureId_sequence_key" ON "encounter_diagnoses"("chargeCaptureId", "sequence");

CREATE INDEX "encounter_service_lines_chargeCaptureId_idx" ON "encounter_service_lines"("chargeCaptureId");
CREATE INDEX "encounter_service_lines_procedureCode_idx" ON "encounter_service_lines"("procedureCode");
CREATE UNIQUE INDEX "encounter_service_lines_chargeCaptureId_lineNumber_key" ON "encounter_service_lines"("chargeCaptureId", "lineNumber");

CREATE UNIQUE INDEX "claims_claimNumber_key" ON "claims"("claimNumber");
CREATE INDEX "claims_patientId_idx" ON "claims"("patientId");
CREATE INDEX "claims_appointmentId_idx" ON "claims"("appointmentId");
CREATE INDEX "claims_chargeCaptureId_idx" ON "claims"("chargeCaptureId");
CREATE INDEX "claims_status_idx" ON "claims"("status");
CREATE INDEX "claims_dateOfService_idx" ON "claims"("dateOfService");
CREATE INDEX "claims_claimNumber_idx" ON "claims"("claimNumber");

CREATE INDEX "claim_diagnoses_claimId_idx" ON "claim_diagnoses"("claimId");
CREATE UNIQUE INDEX "claim_diagnoses_claimId_sequence_key" ON "claim_diagnoses"("claimId", "sequence");

CREATE INDEX "claim_service_lines_claimId_idx" ON "claim_service_lines"("claimId");
CREATE UNIQUE INDEX "claim_service_lines_claimId_lineNumber_key" ON "claim_service_lines"("claimId", "lineNumber");

ALTER TABLE "encounter_charge_captures" ADD CONSTRAINT "encounter_charge_captures_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "encounter_charge_captures" ADD CONSTRAINT "encounter_charge_captures_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "encounter_charge_captures" ADD CONSTRAINT "encounter_charge_captures_renderingProviderId_fkey" FOREIGN KEY ("renderingProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "encounter_diagnoses" ADD CONSTRAINT "encounter_diagnoses_chargeCaptureId_fkey" FOREIGN KEY ("chargeCaptureId") REFERENCES "encounter_charge_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "encounter_service_lines" ADD CONSTRAINT "encounter_service_lines_chargeCaptureId_fkey" FOREIGN KEY ("chargeCaptureId") REFERENCES "encounter_charge_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "claims" ADD CONSTRAINT "claims_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "claims" ADD CONSTRAINT "claims_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "claims" ADD CONSTRAINT "claims_chargeCaptureId_fkey" FOREIGN KEY ("chargeCaptureId") REFERENCES "encounter_charge_captures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "claims" ADD CONSTRAINT "claims_renderingProviderId_fkey" FOREIGN KEY ("renderingProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "claim_diagnoses" ADD CONSTRAINT "claim_diagnoses_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "claim_service_lines" ADD CONSTRAINT "claim_service_lines_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
