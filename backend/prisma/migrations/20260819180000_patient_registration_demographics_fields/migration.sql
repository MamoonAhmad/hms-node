-- Patient registration demographics: no-email flow, veteran/disability detail, mailing country

ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "noEmail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "noEmailReason" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "veteranStatusDetail" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "disabilityType" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "mailingCountry" TEXT DEFAULT 'US';
