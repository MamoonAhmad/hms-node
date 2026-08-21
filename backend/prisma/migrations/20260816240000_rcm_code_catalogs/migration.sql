-- RCM code catalogs: ICD-10, HCPCS Level II, CPT / charge master billing fields

ALTER TABLE "hcpcs_codes"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "category" TEXT,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "isBillable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "coverageStatus" TEXT NOT NULL DEFAULT 'covered',
  ADD COLUMN "ndcRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "defaultModifier" TEXT,
  ADD COLUMN "revenueCode" TEXT,
  ADD COLUMN "unitPrice" DECIMAL(12,2),
  ADD COLUMN "unitType" TEXT,
  ADD COLUMN "placeOfService" TEXT,
  ADD COLUMN "codingNotes" TEXT;

CREATE INDEX "hcpcs_codes_category_idx" ON "hcpcs_codes"("category");
CREATE INDEX "hcpcs_codes_isActive_idx" ON "hcpcs_codes"("isActive");
CREATE INDEX "hcpcs_codes_isBillable_idx" ON "hcpcs_codes"("isBillable");
CREATE INDEX "hcpcs_codes_coverageStatus_idx" ON "hcpcs_codes"("coverageStatus");

ALTER TABLE "diagnosis_codes"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "chapter" TEXT,
  ADD COLUMN "isBillable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "laterality" TEXT,
  ADD COLUMN "genderRestriction" TEXT,
  ADD COLUMN "ageMin" INTEGER,
  ADD COLUMN "ageMax" INTEGER,
  ADD COLUMN "hccCategory" TEXT,
  ADD COLUMN "isUnspecified" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "diagnosis_codes_chapter_idx" ON "diagnosis_codes"("chapter");
CREATE INDEX "diagnosis_codes_isBillable_idx" ON "diagnosis_codes"("isBillable");

ALTER TABLE "procedures"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "codeType" TEXT NOT NULL DEFAULT 'CPT',
  ADD COLUMN "globalPeriod" TEXT,
  ADD COLUMN "workRvu" DECIMAL(8,2),
  ADD COLUMN "facilityRvu" DECIMAL(8,2),
  ADD COLUMN "nonFacilityRvu" DECIMAL(8,2),
  ADD COLUMN "isAddOn" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "bilateralIndicator" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "genderRestriction" TEXT,
  ADD COLUMN "ageMin" INTEGER,
  ADD COLUMN "ageMax" INTEGER,
  ADD COLUMN "effectiveDate" DATE,
  ADD COLUMN "expiryDate" DATE,
  ADD COLUMN "codingNotes" TEXT,
  ADD COLUMN "chargeCode" TEXT,
  ADD COLUMN "cashPrice" DECIMAL(12,2),
  ADD COLUMN "cost" DECIMAL(12,2),
  ADD COLUMN "discountPercent" DECIMAL(5,2),
  ADD COLUMN "priceEffectiveDate" DATE,
  ADD COLUMN "priceExpiryDate" DATE,
  ADD COLUMN "defaultUnits" DECIMAL(8,2),
  ADD COLUMN "ndcCode" TEXT,
  ADD COLUMN "taxable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "location" TEXT,
  ADD COLUMN "payerName" TEXT;

CREATE INDEX "procedures_chargeCode_idx" ON "procedures"("chargeCode");
CREATE INDEX "procedures_isActive_idx" ON "procedures"("isActive");
CREATE INDEX "procedures_isBillable_idx" ON "procedures"("isBillable");
CREATE INDEX "procedures_codeType_idx" ON "procedures"("codeType");
