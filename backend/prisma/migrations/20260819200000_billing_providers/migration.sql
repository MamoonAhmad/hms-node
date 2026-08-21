-- Billing providers catalog (separate from clinical providers)
CREATE TABLE "billing_providers" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "npi" TEXT,
  "taxId" TEXT,
  "address" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "deletedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "billing_providers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "billing_providers_name_idx" ON "billing_providers"("name");
CREATE INDEX "billing_providers_npi_idx" ON "billing_providers"("npi");
CREATE INDEX "billing_providers_code_idx" ON "billing_providers"("code");
CREATE INDEX "billing_providers_isActive_idx" ON "billing_providers"("isActive");
CREATE INDEX "billing_providers_deletedAt_idx" ON "billing_providers"("deletedAt");

ALTER TABLE "billing_providers"
  ADD CONSTRAINT "billing_providers_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "billing_providers"
  ADD CONSTRAINT "billing_providers_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "billing_providers"
  ADD CONSTRAINT "billing_providers_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Repoint claim billing provider FK from providers -> billing_providers
ALTER TABLE "patient_claims" DROP CONSTRAINT IF EXISTS "patient_claims_billingProviderId_fkey";

UPDATE "patient_claims" SET "billingProviderId" = NULL WHERE "billingProviderId" IS NOT NULL;

ALTER TABLE "patient_claims"
  ADD CONSTRAINT "patient_claims_billingProviderId_fkey"
  FOREIGN KEY ("billingProviderId") REFERENCES "billing_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
