-- Appointment cancel / no-show / reschedule lifecycle fields
ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelledBy" TEXT,
  ADD COLUMN IF NOT EXISTS "cancellationReasonCode" TEXT,
  ADD COLUMN IF NOT EXISTS "cancellationReasonNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "cancellationFeeAmount" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "cancellationFeeWaived" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "cancellationFeeWaiveReason" TEXT,
  ADD COLUMN IF NOT EXISTS "noShowAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "noShowBy" TEXT,
  ADD COLUMN IF NOT EXISTS "noShowReasonCode" TEXT,
  ADD COLUMN IF NOT EXISTS "noShowReasonNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "noShowFeeAmount" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "noShowFeeWaived" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "noShowFeeWaiveReason" TEXT,
  ADD COLUMN IF NOT EXISTS "rescheduledFromId" TEXT,
  ADD COLUMN IF NOT EXISTS "rescheduledToId" TEXT,
  ADD COLUMN IF NOT EXISTS "policyOutcome" JSONB,
  ADD COLUMN IF NOT EXISTS "feeChargeId" TEXT;

CREATE INDEX IF NOT EXISTS "appointments_rescheduledFromId_idx" ON "appointments"("rescheduledFromId");
CREATE INDEX IF NOT EXISTS "appointments_rescheduledToId_idx" ON "appointments"("rescheduledToId");

CREATE TABLE IF NOT EXISTS "appointment_policies" (
  "id" TEXT NOT NULL,
  "lateCancelHours" INTEGER NOT NULL DEFAULT 24,
  "lateCancelFee" DECIMAL(10,2) NOT NULL DEFAULT 25,
  "noShowFee" DECIMAL(10,2) NOT NULL DEFAULT 50,
  "allowFeeWaive" BOOLEAN NOT NULL DEFAULT true,
  "blockAfterNoShowCount" INTEGER,
  "autoNoShowMinutesPast" INTEGER NOT NULL DEFAULT 15,
  "notifyPatientOnCancel" BOOLEAN NOT NULL DEFAULT true,
  "notifyPatientOnNoShow" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "appointment_policies_pkey" PRIMARY KEY ("id")
);

INSERT INTO "appointment_policies" ("id", "lateCancelHours", "lateCancelFee", "noShowFee", "allowFeeWaive", "blockAfterNoShowCount", "autoNoShowMinutesPast", "notifyPatientOnCancel", "notifyPatientOnNoShow", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 24, 25, 50, true, 3, 15, true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "appointment_policies" WHERE "isActive" = true);

CREATE TABLE IF NOT EXISTS "appointment_reason_codes" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "appointment_reason_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "appointment_reason_codes_category_code_key"
  ON "appointment_reason_codes"("category", "code");
CREATE INDEX IF NOT EXISTS "appointment_reason_codes_category_idx" ON "appointment_reason_codes"("category");
CREATE INDEX IF NOT EXISTS "appointment_reason_codes_isActive_idx" ON "appointment_reason_codes"("isActive");

INSERT INTO "appointment_reason_codes" ("id", "category", "code", "label", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'cancel', 'patient_request', 'Patient request', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'cancel', 'provider_unavailable', 'Provider unavailable', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'cancel', 'weather', 'Weather / facility closure', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'cancel', 'insurance_issue', 'Insurance / authorization issue', true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'cancel', 'moved_care', 'Moved care elsewhere', true, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'cancel', 'duplicate', 'Duplicate booking', true, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'cancel', 'other', 'Other', true, 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'no_show', 'patient_did_not_arrive', 'Patient did not arrive', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'no_show', 'unreachable', 'Unable to reach patient', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'no_show', 'wrong_day', 'Wrong day / time confusion', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'no_show', 'transport', 'Transportation issue', true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'no_show', 'forgot', 'Patient forgot', true, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'no_show', 'other', 'Other', true, 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("category", "code") DO NOTHING;
