-- CreateTable
CREATE TABLE "patient_checkouts" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "checklistOverrides" JSONB,
    "followUpRequired" BOOLEAN,
    "followUpTimeframe" TEXT,
    "followUpReason" TEXT,
    "followUpData" JSONB,
    "billingData" JSONB,
    "insuranceStatus" TEXT,
    "documentsMeta" JSONB,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "completedByName" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelReason" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "reopenedBy" TEXT,
    "reopenedByName" TEXT,
    "reopenReason" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_checkout_instructions" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "instructionType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "printedAt" TIMESTAMP(3),
    "sentToPortalAt" TIMESTAMP(3),
    "emailedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdByName" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_checkout_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_checkout_notes" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "noteType" TEXT NOT NULL DEFAULT 'general',
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_checkout_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_checkout_tasks" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assignedTo" TEXT,
    "assignedToName" TEXT,
    "dueDate" DATE,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_checkout_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_checkout_payments" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "amountDue" DECIMAL(10,2),
    "paymentAmount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionRef" TEXT,
    "notes" TEXT,
    "balanceRemaining" DECIMAL(10,2),
    "receiptNumber" TEXT,
    "collectedBy" TEXT,
    "collectedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_checkout_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_checkout_audit_logs" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_checkout_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_checkouts_appointmentId_key" ON "patient_checkouts"("appointmentId");

-- CreateIndex
CREATE INDEX "patient_checkouts_patientId_idx" ON "patient_checkouts"("patientId");

-- CreateIndex
CREATE INDEX "patient_checkouts_status_idx" ON "patient_checkouts"("status");

-- CreateIndex
CREATE INDEX "patient_checkouts_completedAt_idx" ON "patient_checkouts"("completedAt");

-- CreateIndex
CREATE INDEX "patient_checkout_instructions_checkoutId_idx" ON "patient_checkout_instructions"("checkoutId");

-- CreateIndex
CREATE INDEX "patient_checkout_instructions_instructionType_idx" ON "patient_checkout_instructions"("instructionType");

-- CreateIndex
CREATE INDEX "patient_checkout_notes_checkoutId_idx" ON "patient_checkout_notes"("checkoutId");

-- CreateIndex
CREATE INDEX "patient_checkout_notes_noteType_idx" ON "patient_checkout_notes"("noteType");

-- CreateIndex
CREATE INDEX "patient_checkout_tasks_checkoutId_idx" ON "patient_checkout_tasks"("checkoutId");

-- CreateIndex
CREATE INDEX "patient_checkout_tasks_status_idx" ON "patient_checkout_tasks"("status");

-- CreateIndex
CREATE INDEX "patient_checkout_payments_checkoutId_idx" ON "patient_checkout_payments"("checkoutId");

-- CreateIndex
CREATE INDEX "patient_checkout_payments_createdAt_idx" ON "patient_checkout_payments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "patient_checkout_payments_receiptNumber_key" ON "patient_checkout_payments"("receiptNumber");

-- CreateIndex
CREATE INDEX "patient_checkout_audit_logs_checkoutId_idx" ON "patient_checkout_audit_logs"("checkoutId");

-- CreateIndex
CREATE INDEX "patient_checkout_audit_logs_createdAt_idx" ON "patient_checkout_audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "patient_checkouts" ADD CONSTRAINT "patient_checkouts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_checkouts" ADD CONSTRAINT "patient_checkouts_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_checkout_instructions" ADD CONSTRAINT "patient_checkout_instructions_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "patient_checkouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_checkout_notes" ADD CONSTRAINT "patient_checkout_notes_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "patient_checkouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_checkout_tasks" ADD CONSTRAINT "patient_checkout_tasks_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "patient_checkouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_checkout_payments" ADD CONSTRAINT "patient_checkout_payments_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "patient_checkouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_checkout_audit_logs" ADD CONSTRAINT "patient_checkout_audit_logs_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "patient_checkouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
