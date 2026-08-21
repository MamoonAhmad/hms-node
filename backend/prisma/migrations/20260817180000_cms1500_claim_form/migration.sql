-- CMS-1500 professional claim form: provider/facility/payer FKs and child tables

ALTER TABLE "patient_claims"
  ADD COLUMN IF NOT EXISTS "renderingProviderId" TEXT,
  ADD COLUMN IF NOT EXISTS "billingProviderId" TEXT,
  ADD COLUMN IF NOT EXISTS "supervisingProviderId" TEXT,
  ADD COLUMN IF NOT EXISTS "orderingProviderId" TEXT,
  ADD COLUMN IF NOT EXISTS "referringProviderId" TEXT,
  ADD COLUMN IF NOT EXISTS "facilityId" TEXT,
  ADD COLUMN IF NOT EXISTS "primaryPayerId" TEXT,
  ADD COLUMN IF NOT EXISTS "secondaryPayerId" TEXT,
  ADD COLUMN IF NOT EXISTS "tertiaryPayerId" TEXT,
  ADD COLUMN IF NOT EXISTS "submissionStatus" TEXT NOT NULL DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS "totalCharge" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "patientBalance" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "officeLocation" TEXT,
  ADD COLUMN IF NOT EXISTS "claimRef" TEXT,
  ADD COLUMN IF NOT EXISTS "savedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sourceClaimId" TEXT,
  ADD COLUMN IF NOT EXISTS "splitFromClaimId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "patient_claims_claimNumber_key" ON "patient_claims"("claimNumber");
CREATE INDEX IF NOT EXISTS "patient_claims_deletedAt_idx" ON "patient_claims"("deletedAt");
CREATE INDEX IF NOT EXISTS "patient_claims_renderingProviderId_idx" ON "patient_claims"("renderingProviderId");
CREATE INDEX IF NOT EXISTS "patient_claims_billingProviderId_idx" ON "patient_claims"("billingProviderId");
CREATE INDEX IF NOT EXISTS "patient_claims_facilityId_idx" ON "patient_claims"("facilityId");
CREATE INDEX IF NOT EXISTS "patient_claims_primaryPayerId_idx" ON "patient_claims"("primaryPayerId");
CREATE INDEX IF NOT EXISTS "patient_claims_submissionStatus_idx" ON "patient_claims"("submissionStatus");

ALTER TABLE "patient_claims"
  ADD CONSTRAINT "patient_claims_renderingProviderId_fkey"
    FOREIGN KEY ("renderingProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "patient_claims_billingProviderId_fkey"
    FOREIGN KEY ("billingProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "patient_claims_supervisingProviderId_fkey"
    FOREIGN KEY ("supervisingProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "patient_claims_orderingProviderId_fkey"
    FOREIGN KEY ("orderingProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "patient_claims_referringProviderId_fkey"
    FOREIGN KEY ("referringProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "patient_claims_facilityId_fkey"
    FOREIGN KEY ("facilityId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "patient_claims_primaryPayerId_fkey"
    FOREIGN KEY ("primaryPayerId") REFERENCES "insurance_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "patient_claims_secondaryPayerId_fkey"
    FOREIGN KEY ("secondaryPayerId") REFERENCES "insurance_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "patient_claims_tertiaryPayerId_fkey"
    FOREIGN KEY ("tertiaryPayerId") REFERENCES "insurance_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "claim_lines"
  ADD COLUMN IF NOT EXISTS "serviceToDate" DATE,
  ADD COLUMN IF NOT EXISTS "modifier1" TEXT,
  ADD COLUMN IF NOT EXISTS "modifier2" TEXT,
  ADD COLUMN IF NOT EXISTS "modifier3" TEXT,
  ADD COLUMN IF NOT EXISTS "modifier4" TEXT,
  ADD COLUMN IF NOT EXISTS "typeOfService" TEXT,
  ADD COLUMN IF NOT EXISTS "inventoryCode" TEXT,
  ADD COLUMN IF NOT EXISTS "chiropractic" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "chargeStatus" TEXT NOT NULL DEFAULT 'no_change';

CREATE INDEX IF NOT EXISTS "claim_lines_chargeStatus_idx" ON "claim_lines"("chargeStatus");

CREATE TABLE IF NOT EXISTS "claim_diagnoses" (
  "id" TEXT PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "pointer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "diagnosisCodeId" TEXT,
  "code" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "claim_diagnoses_claimId_fkey"
    FOREIGN KEY ("claimId") REFERENCES "patient_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "claim_diagnoses_diagnosisCodeId_fkey"
    FOREIGN KEY ("diagnosisCodeId") REFERENCES "diagnosis_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "claim_diagnoses_claimId_pointer_key" ON "claim_diagnoses"("claimId", "pointer");
CREATE INDEX IF NOT EXISTS "claim_diagnoses_claimId_idx" ON "claim_diagnoses"("claimId");
CREATE INDEX IF NOT EXISTS "claim_diagnoses_diagnosisCodeId_idx" ON "claim_diagnoses"("diagnosisCodeId");

CREATE TABLE IF NOT EXISTS "claim_insurances" (
  "id" TEXT PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "payerId" TEXT,
  "memberId" TEXT,
  "groupNumber" TEXT,
  "policyType" TEXT,
  "subscriberFirstName" TEXT,
  "subscriberLastName" TEXT,
  "subscriberName" TEXT,
  "subscriberDob" DATE,
  "subscriberRelationship" TEXT,
  "copayDue" DECIMAL(10,2),
  "authorizationNumber" TEXT,
  "referralType" TEXT,
  "claimControlRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "claim_insurances_claimId_fkey"
    FOREIGN KEY ("claimId") REFERENCES "patient_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "claim_insurances_payerId_fkey"
    FOREIGN KEY ("payerId") REFERENCES "insurance_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "claim_insurances_claimId_tier_key" ON "claim_insurances"("claimId", "tier");
CREATE INDEX IF NOT EXISTS "claim_insurances_claimId_idx" ON "claim_insurances"("claimId");
CREATE INDEX IF NOT EXISTS "claim_insurances_payerId_idx" ON "claim_insurances"("payerId");

CREATE TABLE IF NOT EXISTS "claim_additional_info" (
  "id" TEXT PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "employmentRelated" BOOLEAN NOT NULL DEFAULT false,
  "autoAccident" BOOLEAN NOT NULL DEFAULT false,
  "accidentState" TEXT,
  "otherAccident" BOOLEAN NOT NULL DEFAULT false,
  "onsetDate" DATE,
  "lastMenstrualPeriod" DATE,
  "initialTreatmentDate" DATE,
  "similarIllnessDate" DATE,
  "dateLastSeen" DATE,
  "unableToWorkFrom" DATE,
  "unableToWorkTo" DATE,
  "hospitalizationFrom" DATE,
  "hospitalizationTo" DATE,
  "patientHomebound" TEXT,
  "outsideLab" BOOLEAN NOT NULL DEFAULT false,
  "labCharge" DECIMAL(12,2),
  "priorAuthorizationNumber" TEXT,
  "originalReferenceNumber" TEXT,
  "resubmissionCode" TEXT,
  "claimCodes" TEXT,
  "otherClaimId" TEXT,
  "additionalClaimInfo" TEXT,
  "notes" TEXT,
  "delayReasonCode" TEXT,
  "specialProgramCode" TEXT,
  "patientSignatureOnFile" TEXT,
  "insuredSignatureOnFile" TEXT,
  "providerAcceptAssignment" TEXT,
  "documentationMethod" TEXT,
  "documentationType" TEXT,
  "documentationTypeOther" TEXT,
  "patientHeight" TEXT,
  "patientWeight" TEXT,
  "serviceAuthException" TEXT,
  "demonstrationProject" TEXT,
  "mammographyCert" TEXT,
  "investigationalDevice" TEXT,
  "ambulatoryPatientGroup" TEXT,
  "showBoxNumbers" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "claim_additional_info_claimId_fkey"
    FOREIGN KEY ("claimId") REFERENCES "patient_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "claim_additional_info_claimId_key" ON "claim_additional_info"("claimId");

CREATE TABLE IF NOT EXISTS "claim_ambulance_info" (
  "id" TEXT PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "isAmbulanceClaim" BOOLEAN NOT NULL DEFAULT false,
  "ambulanceTransportReason" TEXT,
  "pickupLocation" TEXT,
  "dropoffLocation" TEXT,
  "pickupDate" DATE,
  "pickupTime" TEXT,
  "mileage" DECIMAL(10,2),
  "ambulanceProvider" TEXT,
  "origin" TEXT,
  "destination" TEXT,
  "transportType" TEXT,
  "medicalNecessity" TEXT,
  "notes" TEXT,
  "transportMiles" DECIMAL(10,2),
  "patientWeight" DECIMAL(10,2),
  "roundTripReason" TEXT,
  "stretcherReason" TEXT,
  "pickupAddress" JSONB,
  "dropoffAddress" JSONB,
  "certifications" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "claim_ambulance_info_claimId_fkey"
    FOREIGN KEY ("claimId") REFERENCES "patient_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "claim_ambulance_info_claimId_key" ON "claim_ambulance_info"("claimId");

CREATE TABLE IF NOT EXISTS "claim_charge_history" (
  "id" TEXT PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "claimChargeId" TEXT,
  "action" TEXT NOT NULL,
  "fieldName" TEXT,
  "oldValue" TEXT,
  "newValue" TEXT,
  "reason" TEXT,
  "changedBy" TEXT,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "claim_charge_history_claimId_fkey"
    FOREIGN KEY ("claimId") REFERENCES "patient_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "claim_charge_history_claimChargeId_fkey"
    FOREIGN KEY ("claimChargeId") REFERENCES "claim_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "claim_charge_history_claimId_idx" ON "claim_charge_history"("claimId");
CREATE INDEX IF NOT EXISTS "claim_charge_history_claimChargeId_idx" ON "claim_charge_history"("claimChargeId");
CREATE INDEX IF NOT EXISTS "claim_charge_history_changedAt_idx" ON "claim_charge_history"("changedAt");
