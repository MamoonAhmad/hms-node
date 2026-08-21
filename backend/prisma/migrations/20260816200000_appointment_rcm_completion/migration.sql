-- Appointment RCM / operational completion (extend, do not replace)

-- Expand eligibility
ALTER TABLE "insurance_eligibility_verifications"
  ADD COLUMN IF NOT EXISTS "appointmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "patientInsuranceId" TEXT,
  ADD COLUMN IF NOT EXISTS "insuranceProviderId" TEXT,
  ADD COLUMN IF NOT EXISTS "coverageStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "verificationSource" TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "groupNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriberFirstName" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriberLastName" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriberRelationship" TEXT,
  ADD COLUMN IF NOT EXISTS "effectiveDate" DATE,
  ADD COLUMN IF NOT EXISTS "terminationDate" DATE,
  ADD COLUMN IF NOT EXISTS "copay" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "coinsurancePercentage" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "deductible" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "deductibleRemaining" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "outOfPocketMax" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "outOfPocketRemaining" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "referralRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "priorAuthRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "benefitsSummary" JSONB,
  ADD COLUMN IF NOT EXISTS "requestPayload" JSONB,
  ADD COLUMN IF NOT EXISTS "responsePayload" JSONB,
  ADD COLUMN IF NOT EXISTS "externalTraceId" TEXT,
  ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

CREATE INDEX IF NOT EXISTS "insurance_eligibility_verifications_appointmentId_idx"
  ON "insurance_eligibility_verifications"("appointmentId");
CREATE INDEX IF NOT EXISTS "insurance_eligibility_verifications_verifiedAt_idx"
  ON "insurance_eligibility_verifications"("verifiedAt");

-- Expand appointment policy
ALTER TABLE "appointment_policies"
  ADD COLUMN IF NOT EXISTS "requireDepositAfterNoShows" INTEGER,
  ADD COLUMN IF NOT EXISTS "depositAmount" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "maxRescheduleCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "reminderHoursBefore" JSONB,
  ADD COLUMN IF NOT EXISTS "waitlistAutoOffer" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "confirmationRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "refundPolicyNotes" TEXT;

-- Expand appointments
ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "rcmStatus" TEXT NOT NULL DEFAULT 'Eligibility Pending',
  ADD COLUMN IF NOT EXISTS "locationId" TEXT,
  ADD COLUMN IF NOT EXISTS "placeOfService" TEXT,
  ADD COLUMN IF NOT EXISTS "primaryInsuranceId" TEXT,
  ADD COLUMN IF NOT EXISTS "secondaryInsuranceId" TEXT,
  ADD COLUMN IF NOT EXISTS "latestEligibilityId" TEXT,
  ADD COLUMN IF NOT EXISTS "priorAuthorizationId" TEXT,
  ADD COLUMN IF NOT EXISTS "referralId" TEXT,
  ADD COLUMN IF NOT EXISTS "recurringSeriesId" TEXT,
  ADD COLUMN IF NOT EXISTS "recurringOccurrenceIndex" INTEGER,
  ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "arrivedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "checkedInAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "checkedInBy" TEXT,
  ADD COLUMN IF NOT EXISTS "readyAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "checkoutAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "telehealthPlatform" TEXT,
  ADD COLUMN IF NOT EXISTS "telehealthJoinUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "telehealthMeetingId" TEXT,
  ADD COLUMN IF NOT EXISTS "telehealthJoinStatus" TEXT;

CREATE INDEX IF NOT EXISTS "appointments_rcmStatus_idx" ON "appointments"("rcmStatus");
CREATE INDEX IF NOT EXISTS "appointments_locationId_idx" ON "appointments"("locationId");
CREATE INDEX IF NOT EXISTS "appointments_recurringSeriesId_idx" ON "appointments"("recurringSeriesId");

CREATE TABLE IF NOT EXISTS "ledger_transactions" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "appointmentId" TEXT,
  "transactionType" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "direction" TEXT NOT NULL,
  "description" TEXT,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "paymentMethod" TEXT,
  "externalRef" TEXT,
  "status" TEXT NOT NULL DEFAULT 'posted',
  "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reversedAt" TIMESTAMP(3),
  "reversalOfId" TEXT,
  "meta" JSONB,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ledger_transactions_patientId_idx" ON "ledger_transactions"("patientId");
CREATE INDEX IF NOT EXISTS "ledger_transactions_appointmentId_idx" ON "ledger_transactions"("appointmentId");
CREATE INDEX IF NOT EXISTS "ledger_transactions_transactionType_idx" ON "ledger_transactions"("transactionType");
CREATE INDEX IF NOT EXISTS "ledger_transactions_postedAt_idx" ON "ledger_transactions"("postedAt");

CREATE TABLE IF NOT EXISTS "appointment_payments" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "ledgerTransactionId" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "paymentStatus" TEXT NOT NULL DEFAULT 'collected',
  "purpose" TEXT NOT NULL DEFAULT 'copay',
  "externalRef" TEXT,
  "notes" TEXT,
  "collectedBy" TEXT,
  "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "appointment_payments_patientId_idx" ON "appointment_payments"("patientId");
CREATE INDEX IF NOT EXISTS "appointment_payments_appointmentId_idx" ON "appointment_payments"("appointmentId");

CREATE TABLE IF NOT EXISTS "prior_authorizations" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "appointmentId" TEXT,
  "insuranceProviderId" TEXT,
  "authorizationNumber" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "payerName" TEXT,
  "providerId" TEXT,
  "serviceCode" TEXT,
  "serviceDescription" TEXT,
  "approvedUnits" INTEGER,
  "usedUnits" INTEGER NOT NULL DEFAULT 0,
  "remainingUnits" INTEGER,
  "effectiveDate" DATE,
  "expirationDate" DATE,
  "notes" TEXT,
  "attachmentMeta" JSONB,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "prior_authorizations_patientId_idx" ON "prior_authorizations"("patientId");
CREATE INDEX IF NOT EXISTS "prior_authorizations_appointmentId_idx" ON "prior_authorizations"("appointmentId");
CREATE INDEX IF NOT EXISTS "prior_authorizations_status_idx" ON "prior_authorizations"("status");

CREATE TABLE IF NOT EXISTS "notification_templates" (
  "id" TEXT PRIMARY KEY,
  "eventKey" TEXT NOT NULL UNIQUE,
  "channel" TEXT NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "notification_logs" (
  "id" TEXT PRIMARY KEY,
  "eventKey" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "patientId" TEXT,
  "appointmentId" TEXT,
  "templateId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "providerMessageId" TEXT,
  "error" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "payload" JSONB,
  "sentAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "notification_logs_eventKey_idx" ON "notification_logs"("eventKey");
CREATE INDEX IF NOT EXISTS "notification_logs_status_idx" ON "notification_logs"("status");
CREATE INDEX IF NOT EXISTS "notification_logs_appointmentId_idx" ON "notification_logs"("appointmentId");

CREATE TABLE IF NOT EXISTS "recurring_appointment_series" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "providerId" TEXT,
  "departmentId" TEXT,
  "appointmentTypeId" TEXT,
  "frequency" TEXT NOT NULL,
  "interval" INTEGER NOT NULL DEFAULT 1,
  "daysOfWeek" JSONB,
  "startDate" DATE NOT NULL,
  "endDate" DATE,
  "occurrenceCount" INTEGER,
  "exclusions" JSONB,
  "preferredTime" TEXT,
  "duration" INTEGER NOT NULL DEFAULT 30,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "recurring_appointment_series_patientId_idx" ON "recurring_appointment_series"("patientId");

CREATE TABLE IF NOT EXISTS "room_assignments" (
  "id" TEXT PRIMARY KEY,
  "appointmentId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMP(3),
  "assignedBy" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Assigned'
);
CREATE INDEX IF NOT EXISTS "room_assignments_appointmentId_idx" ON "room_assignments"("appointmentId");
CREATE INDEX IF NOT EXISTS "room_assignments_roomId_idx" ON "room_assignments"("roomId");

CREATE TABLE IF NOT EXISTS "referral_records" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "appointmentId" TEXT,
  "referralType" TEXT,
  "referralNumber" TEXT,
  "referringProviderName" TEXT,
  "referringProviderNpi" TEXT,
  "referredProviderId" TEXT,
  "referringFacility" TEXT,
  "receivingFacility" TEXT,
  "referralDate" DATE,
  "referralReason" TEXT,
  "diagnosisCode" TEXT,
  "diagnosisDescription" TEXT,
  "authorizationNumber" TEXT,
  "effectiveDate" DATE,
  "expirationDate" DATE,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "legacyPayload" JSONB,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "referral_records_patientId_idx" ON "referral_records"("patientId");
CREATE INDEX IF NOT EXISTS "referral_records_appointmentId_idx" ON "referral_records"("appointmentId");

-- FKs (best-effort; ignore if already present by using DO blocks)
DO $$ BEGIN
  ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "prior_authorizations" ADD CONSTRAINT "prior_authorizations_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "room_assignments" ADD CONSTRAINT "room_assignments_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "room_assignments" ADD CONSTRAINT "room_assignments_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "referral_records" ADD CONSTRAINT "referral_records_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_recurringSeriesId_fkey"
    FOREIGN KEY ("recurringSeriesId") REFERENCES "recurring_appointment_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed notification templates
INSERT INTO "notification_templates" ("id", "eventKey", "channel", "subject", "body", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'appointment.confirmation', 'email', 'Appointment Confirmation', 'Your appointment is confirmed for {{date}} at {{time}}.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'appointment.reminder', 'sms', NULL, 'Reminder: appointment on {{date}} at {{time}}.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'appointment.cancellation', 'email', 'Appointment Cancelled', 'Your appointment on {{date}} was cancelled.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'appointment.no_show', 'email', 'Missed Appointment', 'You were marked as no-show for {{date}}.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'appointment.reschedule', 'email', 'Appointment Rescheduled', 'Your appointment was rescheduled to {{date}} at {{time}}.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'waitlist.offer', 'sms', NULL, 'A slot is available on {{date}} at {{time}}. Reply to accept.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'waitlist.booked', 'email', 'Waitlist Appointment Booked', 'Your waitlist appointment is booked for {{date}} at {{time}}.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("eventKey") DO NOTHING;

-- Seed Confirmed / Arrived appointment statuses if missing
INSERT INTO "appointment_statuses" ("id", "name", "color", "isActive", "sortOrder", "createdBy", "updatedBy", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.name, v.color, true, v.sort_order, u.id, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('Confirmed', '#0F8B8D', 5),
  ('Arrived', '#b45309', 8)
) AS v(name, color, sort_order)
CROSS JOIN LATERAL (
  SELECT id FROM "users" ORDER BY "createdAt" ASC LIMIT 1
) u
WHERE NOT EXISTS (
  SELECT 1 FROM "appointment_statuses" s WHERE s.name = v.name AND s."deletedAt" IS NULL
);
