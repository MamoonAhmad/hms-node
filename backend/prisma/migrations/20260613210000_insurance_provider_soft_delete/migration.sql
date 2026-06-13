-- Soft delete audit for insurance providers (payers)

ALTER TABLE "insurance_providers" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "insurance_providers" ADD COLUMN "deletedBy" TEXT;

DROP INDEX IF EXISTS "insurance_providers_name_key";
DROP INDEX IF EXISTS "insurance_providers_code_key";

CREATE UNIQUE INDEX "insurance_providers_name_not_deleted_key"
  ON "insurance_providers"("name")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "insurance_providers_code_not_deleted_key"
  ON "insurance_providers"("code")
  WHERE "deletedAt" IS NULL AND "code" IS NOT NULL;

CREATE INDEX "insurance_providers_deletedAt_idx" ON "insurance_providers"("deletedAt");

ALTER TABLE "insurance_providers"
  ADD CONSTRAINT "insurance_providers_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
