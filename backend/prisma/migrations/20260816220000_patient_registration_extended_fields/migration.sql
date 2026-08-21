-- Extended patient registration fields, insurance claim metadata, and document metadata

ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "prefix" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "ssnLast4" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "county" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "mailingSameAsResidential" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "mailingAddress" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "mailingAddressLine2" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "mailingCity" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "mailingState" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "mailingZip" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "governmentIdState" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "governmentIdExpiration" DATE;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "medicareBeneficiaryId" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "medicaidId" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "preferredPharmacyName" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "preferredPharmacyPhone" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "preferredPharmacyAddress" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "smsOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "emailOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "reminderOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "hipaaRoiName" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "hipaaRoiRelationship" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "hipaaRoiPhone" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "hipaaRoiEmail" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "advanceDirectiveOnFile" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "advanceDirectiveType" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "powerOfAttorneyName" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "powerOfAttorneyPhone" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "workersCompClaimNumber" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "autoAccidentClaimNumber" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "billingNotes" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "accountBalance" DECIMAL(10, 2);
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "referredBy" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "countryOther" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "languageOther" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "allergyNotes" TEXT;

ALTER TABLE "patient_insurances" ADD COLUMN IF NOT EXISTS "authorizationRequired" TEXT;
ALTER TABLE "patient_insurances" ADD COLUMN IF NOT EXISTS "claimNumber" TEXT;

ALTER TABLE "patient_documents" ADD COLUMN IF NOT EXISTS "documentName" TEXT;
ALTER TABLE "patient_documents" ADD COLUMN IF NOT EXISTS "documentNotes" TEXT;
ALTER TABLE "patient_documents" ADD COLUMN IF NOT EXISTS "expirationDate" DATE;
ALTER TABLE "patient_documents" ADD COLUMN IF NOT EXISTS "governmentIdType" TEXT;
ALTER TABLE "patient_documents" ADD COLUMN IF NOT EXISTS "insuranceCardSide" TEXT;
