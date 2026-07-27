-- CreateTable
CREATE TABLE "referral_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_referrals" (
    "id" TEXT NOT NULL,
    "referralNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "referralType" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Routine',
    "referralDate" DATE NOT NULL,
    "expirationDate" DATE,
    "referralReason" TEXT NOT NULL,
    "primaryIcd10Code" TEXT,
    "primaryDiagnosis" TEXT,
    "destinationType" TEXT NOT NULL DEFAULT 'external',
    "referredToName" TEXT,
    "referredToOrganization" TEXT,
    "referredToNpi" TEXT,
    "referringProviderName" TEXT,
    "referringProviderNpi" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "authorizationStatus" TEXT NOT NULL DEFAULT 'Not Required',
    "appointmentScheduledDate" TIMESTAMP(3),
    "deliveryMethod" TEXT,
    "sentAt" TIMESTAMP(3),
    "sentBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "referringProvider" JSONB,
    "referredTo" JSONB,
    "diagnoses" JSONB,
    "clinicalInformation" JSONB,
    "attachments" JSONB,
    "insurance" JSONB,
    "referralLetter" JSONB,
    "tracking" JSONB,
    "referralAppointment" JSONB,
    "consultationReport" JSONB,
    "completion" JSONB,
    "alerts" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_referral_notes" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "noteType" TEXT NOT NULL DEFAULT 'General',
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_referral_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_referral_timeline_events" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "notes" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_referral_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_referral_audit_logs" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_referral_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_types_name_key" ON "referral_types"("name");
CREATE INDEX "referral_types_isActive_idx" ON "referral_types"("isActive");
CREATE INDEX "referral_types_sortOrder_idx" ON "referral_types"("sortOrder");
CREATE INDEX "referral_types_deletedAt_idx" ON "referral_types"("deletedAt");

CREATE UNIQUE INDEX "patient_referrals_referralNumber_key" ON "patient_referrals"("referralNumber");
CREATE INDEX "patient_referrals_patientId_idx" ON "patient_referrals"("patientId");
CREATE INDEX "patient_referrals_appointmentId_idx" ON "patient_referrals"("appointmentId");
CREATE INDEX "patient_referrals_status_idx" ON "patient_referrals"("status");
CREATE INDEX "patient_referrals_priority_idx" ON "patient_referrals"("priority");
CREATE INDEX "patient_referrals_authorizationStatus_idx" ON "patient_referrals"("authorizationStatus");
CREATE INDEX "patient_referrals_referralDate_idx" ON "patient_referrals"("referralDate");
CREATE INDEX "patient_referrals_expirationDate_idx" ON "patient_referrals"("expirationDate");
CREATE INDEX "patient_referrals_deletedAt_idx" ON "patient_referrals"("deletedAt");

CREATE INDEX "patient_referral_notes_referralId_idx" ON "patient_referral_notes"("referralId");
CREATE INDEX "patient_referral_notes_createdAt_idx" ON "patient_referral_notes"("createdAt");

CREATE INDEX "patient_referral_timeline_events_referralId_idx" ON "patient_referral_timeline_events"("referralId");
CREATE INDEX "patient_referral_timeline_events_eventType_idx" ON "patient_referral_timeline_events"("eventType");
CREATE INDEX "patient_referral_timeline_events_createdAt_idx" ON "patient_referral_timeline_events"("createdAt");

CREATE INDEX "patient_referral_audit_logs_referralId_idx" ON "patient_referral_audit_logs"("referralId");
CREATE INDEX "patient_referral_audit_logs_createdAt_idx" ON "patient_referral_audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "referral_types" ADD CONSTRAINT "referral_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referral_types" ADD CONSTRAINT "referral_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referral_types" ADD CONSTRAINT "referral_types_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "patient_referrals" ADD CONSTRAINT "patient_referrals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_referrals" ADD CONSTRAINT "patient_referrals_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "patient_referrals" ADD CONSTRAINT "patient_referrals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "patient_referrals" ADD CONSTRAINT "patient_referrals_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "patient_referrals" ADD CONSTRAINT "patient_referrals_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "patient_referral_notes" ADD CONSTRAINT "patient_referral_notes_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "patient_referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_referral_notes" ADD CONSTRAINT "patient_referral_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_referral_timeline_events" ADD CONSTRAINT "patient_referral_timeline_events_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "patient_referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patient_referral_audit_logs" ADD CONSTRAINT "patient_referral_audit_logs_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "patient_referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
