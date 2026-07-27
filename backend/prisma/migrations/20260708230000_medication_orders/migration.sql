-- CreateTable
CREATE TABLE "medication_catalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "strength" TEXT,
    "dosageForm" TEXT,
    "medicationClass" TEXT,
    "ndc" TEXT,
    "formularyTier" TEXT,
    "ndcSafetyFlag" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_orders" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "medicationCatalogId" TEXT,
    "medicationName" TEXT NOT NULL,
    "medicationCode" TEXT,
    "medicationClass" TEXT,
    "strength" TEXT,
    "dosageForm" TEXT,
    "formularyTier" TEXT,
    "ndcSafetyFlag" TEXT,
    "handlingMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "dose" TEXT,
    "unit" TEXT,
    "route" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "prn" BOOLEAN NOT NULL DEFAULT false,
    "sigPreview" TEXT,
    "additionalInstructions" TEXT,
    "sampleNdc" TEXT,
    "sampleLotNumber" TEXT,
    "pharmacy" TEXT,
    "quantity" INTEGER,
    "refills" INTEGER,
    "daysSupply" INTEGER,
    "substitutionAllowed" BOOLEAN NOT NULL DEFAULT true,
    "prescriber" TEXT,
    "eRxStatus" TEXT,
    "safetyAlerts" JSONB,
    "safetyAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "orderedBy" TEXT,
    "signedBy" TEXT,
    "signedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_order_audit_logs" (
    "id" TEXT NOT NULL,
    "medicationOrderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_order_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medication_catalog_code_key" ON "medication_catalog"("code");
CREATE INDEX "medication_catalog_name_idx" ON "medication_catalog"("name");
CREATE INDEX "medication_catalog_code_idx" ON "medication_catalog"("code");
CREATE INDEX "medication_catalog_medicationClass_idx" ON "medication_catalog"("medicationClass");
CREATE INDEX "medication_catalog_isActive_idx" ON "medication_catalog"("isActive");
CREATE INDEX "medication_catalog_deletedAt_idx" ON "medication_catalog"("deletedAt");

CREATE INDEX "medication_orders_patientId_idx" ON "medication_orders"("patientId");
CREATE INDEX "medication_orders_appointmentId_idx" ON "medication_orders"("appointmentId");
CREATE INDEX "medication_orders_status_idx" ON "medication_orders"("status");
CREATE INDEX "medication_orders_handlingMethod_idx" ON "medication_orders"("handlingMethod");
CREATE INDEX "medication_orders_createdAt_idx" ON "medication_orders"("createdAt");

CREATE INDEX "medication_order_audit_logs_medicationOrderId_idx" ON "medication_order_audit_logs"("medicationOrderId");
CREATE INDEX "medication_order_audit_logs_createdAt_idx" ON "medication_order_audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "medication_orders" ADD CONSTRAINT "medication_orders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_orders" ADD CONSTRAINT "medication_orders_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "medication_orders" ADD CONSTRAINT "medication_orders_medicationCatalogId_fkey" FOREIGN KEY ("medicationCatalogId") REFERENCES "medication_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "medication_order_audit_logs" ADD CONSTRAINT "medication_order_audit_logs_medicationOrderId_fkey" FOREIGN KEY ("medicationOrderId") REFERENCES "medication_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed medication catalog
INSERT INTO "medication_catalog" ("id", "name", "code", "strength", "dosageForm", "medicationClass", "ndc", "formularyTier", "ndcSafetyFlag", "isActive", "updatedAt") VALUES
(gen_random_uuid()::text, 'Lisinopril 10 mg tablet', 'MED-LISINOPRIL-10MG', '10 mg', 'Tablet', 'ACE Inhibitor', '68180-0473-09', 'Tier 1', 'Verified', true, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'Amlodipine 5 mg tablet', 'MED-AMLODIPINE-5MG', '5 mg', 'Tablet', 'Calcium Channel Blocker', '67877-0199-01', 'Tier 1', 'Verified', true, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'Atorvastatin 20 mg tablet', 'MED-ATORVASTATIN-20MG', '20 mg', 'Tablet', 'Statin', '60505-5790-09', 'Tier 1', 'Verified', true, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'Metoprolol succinate 50 mg ER tablet', 'MED-METOPROLOL-SUCCINATE-50MG', '50 mg', 'Extended-Release Tablet', 'Beta Blocker', '00378-4610-01', 'Tier 2', 'Verified', true, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'Toprol-XL 25mg Extended-Release Tablet', 'MED-TOPROL-XL-25MG', '25 mg', 'Extended-Release Tablet', 'Beta Blocker', '00187-1610-01', 'Tier 2', 'Verified', true, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'Losartan 50 mg tablet', 'MED-LOSARTAN-50MG', '50 mg', 'Tablet', 'ARB', '65862-0047-01', 'Tier 1', 'Verified', true, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'Hydrochlorothiazide 25 mg tablet', 'MED-HCTZ-25MG', '25 mg', 'Tablet', 'Thiazide Diuretic', '00904-2027-61', 'Tier 1', 'Verified', true, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'Carvedilol 12.5 mg tablet', 'MED-CARVEDILO-12-5MG', '12.5 mg', 'Tablet', 'Beta Blocker', '00904-5457-61', 'Tier 2', 'Verified', true, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'Aspirin 81 mg tablet', 'MED-ASPIRIN-81MG', '81 mg', 'Tablet', 'Antiplatelet', '00904-7704-60', 'Tier 1', 'Verified', true, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'Metformin 500 mg tablet', 'MED-METFORMIN-500MG', '500 mg', 'Tablet', 'Biguanide', '00904-6809-61', 'Tier 1', 'Verified', true, CURRENT_TIMESTAMP);
