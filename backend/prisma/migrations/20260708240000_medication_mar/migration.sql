-- CreateTable
CREATE TABLE "medication_mar_entries" (
    "id" TEXT NOT NULL,
    "medicationOrderId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "marStatus" TEXT NOT NULL DEFAULT 'Pending',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "nextDueAt" TIMESTAMP(3),
    "lastAdministeredAt" TIMESTAMP(3),
    "discontinuedAt" TIMESTAMP(3),
    "discontinuedBy" TEXT,
    "discontinueReason" TEXT,
    "sampleNdc" TEXT,
    "sampleLotNumber" TEXT,
    "sampleExpirationDate" TIMESTAMP(3),
    "sampleQuantity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_mar_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_administration_records" (
    "id" TEXT NOT NULL,
    "marEntryId" TEXT NOT NULL,
    "medicationOrderId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "administrationStatus" TEXT NOT NULL,
    "administeredAt" TIMESTAMP(3),
    "doseGiven" TEXT,
    "route" TEXT,
    "site" TEXT,
    "administeredBy" TEXT,
    "administeredByName" TEXT,
    "witnessRequired" BOOLEAN NOT NULL DEFAULT false,
    "witnessName" TEXT,
    "witnessUserId" TEXT,
    "comments" TEXT,
    "holdReason" TEXT,
    "refusalReason" TEXT,
    "missedReason" TEXT,
    "prnReason" TEXT,
    "symptomSeverity" TEXT,
    "preAssessment" TEXT,
    "postAssessment" TEXT,
    "effectivenessEvaluation" TEXT,
    "fiveRightsVerified" JSONB,
    "safetyAlerts" JSONB,
    "safetyAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "signatureUsername" TEXT,
    "signatureMeaning" TEXT,
    "signatureTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_administration_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medication_mar_entries_medicationOrderId_key" ON "medication_mar_entries"("medicationOrderId");

-- CreateIndex
CREATE INDEX "medication_mar_entries_patientId_idx" ON "medication_mar_entries"("patientId");

-- CreateIndex
CREATE INDEX "medication_mar_entries_appointmentId_idx" ON "medication_mar_entries"("appointmentId");

-- CreateIndex
CREATE INDEX "medication_mar_entries_marStatus_idx" ON "medication_mar_entries"("marStatus");

-- CreateIndex
CREATE INDEX "medication_mar_entries_nextDueAt_idx" ON "medication_mar_entries"("nextDueAt");

-- CreateIndex
CREATE INDEX "medication_mar_entries_createdAt_idx" ON "medication_mar_entries"("createdAt");

-- CreateIndex
CREATE INDEX "medication_administration_records_marEntryId_idx" ON "medication_administration_records"("marEntryId");

-- CreateIndex
CREATE INDEX "medication_administration_records_medicationOrderId_idx" ON "medication_administration_records"("medicationOrderId");

-- CreateIndex
CREATE INDEX "medication_administration_records_patientId_idx" ON "medication_administration_records"("patientId");

-- CreateIndex
CREATE INDEX "medication_administration_records_administrationStatus_idx" ON "medication_administration_records"("administrationStatus");

-- CreateIndex
CREATE INDEX "medication_administration_records_administeredAt_idx" ON "medication_administration_records"("administeredAt");

-- CreateIndex
CREATE INDEX "medication_administration_records_createdAt_idx" ON "medication_administration_records"("createdAt");

-- AddForeignKey
ALTER TABLE "medication_mar_entries" ADD CONSTRAINT "medication_mar_entries_medicationOrderId_fkey" FOREIGN KEY ("medicationOrderId") REFERENCES "medication_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_mar_entries" ADD CONSTRAINT "medication_mar_entries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_mar_entries" ADD CONSTRAINT "medication_mar_entries_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_administration_records" ADD CONSTRAINT "medication_administration_records_marEntryId_fkey" FOREIGN KEY ("marEntryId") REFERENCES "medication_mar_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
