-- Consent form templates

CREATE TABLE "consent_forms" (
    "id" TEXT NOT NULL,
    "consentTitle" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "description" TEXT,
    "consentContent" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isSignatureRequired" BOOLEAN NOT NULL DEFAULT true,
    "patientSignaturePlacement" TEXT,
    "requiresWitnessSignature" BOOLEAN NOT NULL DEFAULT false,
    "witnessSignaturePlacement" TEXT,
    "requiresProviderSignature" BOOLEAN NOT NULL DEFAULT false,
    "providerSignaturePlacement" TEXT,
    "effectiveDate" DATE,
    "expiryDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "department" TEXT,
    "language" TEXT,
    "versionNumber" TEXT,
    "tags" TEXT,
    "attachmentName" TEXT,
    "attachmentDataUrl" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_forms_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consent_forms_consentTitle_idx" ON "consent_forms"("consentTitle");
CREATE INDEX "consent_forms_consentType_idx" ON "consent_forms"("consentType");
CREATE INDEX "consent_forms_status_idx" ON "consent_forms"("status");
CREATE INDEX "consent_forms_deletedAt_idx" ON "consent_forms"("deletedAt");

ALTER TABLE "consent_forms"
  ADD CONSTRAINT "consent_forms_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "consent_forms"
  ADD CONSTRAINT "consent_forms_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "consent_forms"
  ADD CONSTRAINT "consent_forms_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
