-- HCPCS codes catalogue

CREATE TABLE "hcpcs_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effectiveDate" DATE,
    "expiryDate" DATE,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hcpcs_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hcpcs_codes_code_not_deleted_key"
  ON "hcpcs_codes"("code")
  WHERE "deletedAt" IS NULL;

CREATE INDEX "hcpcs_codes_code_idx" ON "hcpcs_codes"("code");
CREATE INDEX "hcpcs_codes_effectiveDate_idx" ON "hcpcs_codes"("effectiveDate");
CREATE INDEX "hcpcs_codes_deletedAt_idx" ON "hcpcs_codes"("deletedAt");

ALTER TABLE "hcpcs_codes"
  ADD CONSTRAINT "hcpcs_codes_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "hcpcs_codes"
  ADD CONSTRAINT "hcpcs_codes_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "hcpcs_codes"
  ADD CONSTRAINT "hcpcs_codes_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
