-- Chronic disease template metadata + encounter field values (flexible model)

CREATE TABLE IF NOT EXISTS "chronic_disease_templates" (
    "id" TEXT NOT NULL,
    "diseaseCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultIcd" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chronic_disease_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "chronic_disease_templates_diseaseCode_key"
  ON "chronic_disease_templates"("diseaseCode");
CREATE INDEX IF NOT EXISTS "chronic_disease_templates_active_displayOrder_idx"
  ON "chronic_disease_templates"("active", "displayOrder");

CREATE TABLE IF NOT EXISTS "chronic_disease_template_fields" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "groupKey" TEXT,
    "groupName" TEXT,
    "options" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chronic_disease_template_fields_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "chronic_disease_template_fields_templateId_fieldKey_key"
  ON "chronic_disease_template_fields"("templateId", "fieldKey");
CREATE INDEX IF NOT EXISTS "chronic_disease_template_fields_templateId_displayOrder_idx"
  ON "chronic_disease_template_fields"("templateId", "displayOrder");

ALTER TABLE "chronic_disease_template_fields"
  ADD CONSTRAINT "chronic_disease_template_fields_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "chronic_disease_templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "chronic_disease_encounters" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "conditionCode" TEXT NOT NULL,
    "conditionName" TEXT NOT NULL,
    "icdCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "severity" TEXT,
    "diagnosisDate" DATE,
    "controlStatus" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdByName" TEXT,
    "updatedByName" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chronic_disease_encounters_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "chronic_disease_encounters_patientId_idx"
  ON "chronic_disease_encounters"("patientId");
CREATE INDEX IF NOT EXISTS "chronic_disease_encounters_encounterId_idx"
  ON "chronic_disease_encounters"("encounterId");
CREATE INDEX IF NOT EXISTS "chronic_disease_encounters_conditionCode_idx"
  ON "chronic_disease_encounters"("conditionCode");
CREATE INDEX IF NOT EXISTS "chronic_disease_encounters_isDeleted_idx"
  ON "chronic_disease_encounters"("isDeleted");

ALTER TABLE "chronic_disease_encounters"
  ADD CONSTRAINT "chronic_disease_encounters_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chronic_disease_encounters"
  ADD CONSTRAINT "chronic_disease_encounters_encounterId_fkey"
  FOREIGN KEY ("encounterId") REFERENCES "appointments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "chronic_disease_field_values" (
    "id" TEXT NOT NULL,
    "diseaseRecordId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chronic_disease_field_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "chronic_disease_field_values_diseaseRecordId_fieldKey_key"
  ON "chronic_disease_field_values"("diseaseRecordId", "fieldKey");
CREATE INDEX IF NOT EXISTS "chronic_disease_field_values_diseaseRecordId_idx"
  ON "chronic_disease_field_values"("diseaseRecordId");

ALTER TABLE "chronic_disease_field_values"
  ADD CONSTRAINT "chronic_disease_field_values_diseaseRecordId_fkey"
  FOREIGN KEY ("diseaseRecordId") REFERENCES "chronic_disease_encounters"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
