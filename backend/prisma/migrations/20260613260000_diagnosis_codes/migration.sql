-- ICD-10 diagnosis codes catalogue

CREATE TABLE "diagnosis_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effectiveDate" DATE,
    "expiryDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "codingNotes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnosis_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "diagnosis_codes_code_not_deleted_key"
  ON "diagnosis_codes"("code")
  WHERE "deletedAt" IS NULL;

CREATE INDEX "diagnosis_codes_code_idx" ON "diagnosis_codes"("code");
CREATE INDEX "diagnosis_codes_effectiveDate_idx" ON "diagnosis_codes"("effectiveDate");
CREATE INDEX "diagnosis_codes_isActive_idx" ON "diagnosis_codes"("isActive");
CREATE INDEX "diagnosis_codes_deletedAt_idx" ON "diagnosis_codes"("deletedAt");

ALTER TABLE "diagnosis_codes"
  ADD CONSTRAINT "diagnosis_codes_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "diagnosis_codes"
  ADD CONSTRAINT "diagnosis_codes_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "diagnosis_codes"
  ADD CONSTRAINT "diagnosis_codes_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
