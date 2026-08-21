-- Place of Service (CMS POS) catalog
CREATE TABLE "place_of_service_codes" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT,
  "cmsStandard" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isBillable" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "effectiveDate" DATE,
  "expiryDate" DATE,
  "sortOrder" INTEGER,
  "codingNotes" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "place_of_service_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "place_of_service_codes_code_idx" ON "place_of_service_codes"("code");
CREATE INDEX "place_of_service_codes_category_idx" ON "place_of_service_codes"("category");
CREATE INDEX "place_of_service_codes_isActive_idx" ON "place_of_service_codes"("isActive");
CREATE INDEX "place_of_service_codes_isDefault_idx" ON "place_of_service_codes"("isDefault");
CREATE INDEX "place_of_service_codes_deletedAt_idx" ON "place_of_service_codes"("deletedAt");

ALTER TABLE "place_of_service_codes"
  ADD CONSTRAINT "place_of_service_codes_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "place_of_service_codes"
  ADD CONSTRAINT "place_of_service_codes_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "place_of_service_codes"
  ADD CONSTRAINT "place_of_service_codes_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
