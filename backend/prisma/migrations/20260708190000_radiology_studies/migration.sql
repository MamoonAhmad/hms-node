-- Radiology study catalogue for radiology master and patient orders

CREATE TABLE "radiology_studies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "bodyPart" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radiology_studies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "radiology_studies_code_not_deleted_key"
  ON "radiology_studies"("code")
  WHERE "deletedAt" IS NULL;

CREATE INDEX "radiology_studies_code_idx" ON "radiology_studies"("code");
CREATE INDEX "radiology_studies_name_idx" ON "radiology_studies"("name");
CREATE INDEX "radiology_studies_modality_idx" ON "radiology_studies"("modality");
CREATE INDEX "radiology_studies_bodyPart_idx" ON "radiology_studies"("bodyPart");
CREATE INDEX "radiology_studies_isActive_idx" ON "radiology_studies"("isActive");
CREATE INDEX "radiology_studies_deletedAt_idx" ON "radiology_studies"("deletedAt");
CREATE INDEX "radiology_studies_createdAt_idx" ON "radiology_studies"("createdAt");

ALTER TABLE "radiology_studies"
  ADD CONSTRAINT "radiology_studies_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "radiology_studies"
  ADD CONSTRAINT "radiology_studies_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "radiology_studies"
  ADD CONSTRAINT "radiology_studies_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
