-- Appointment waitlist module

CREATE TABLE IF NOT EXISTS "waitlist_entries" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "preferredProviderId" TEXT,
  "preferredDepartmentId" TEXT,
  "appointmentTypeId" TEXT,
  "preferredDateFrom" DATE,
  "preferredDateTo" DATE,
  "preferredDays" JSONB,
  "preferredTimeWindow" TEXT NOT NULL DEFAULT 'any',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "status" TEXT NOT NULL DEFAULT 'Waiting',
  "reason" TEXT,
  "notes" TEXT,
  "contactPhone" TEXT,
  "contactEmail" TEXT,
  "sourceAppointmentId" TEXT,
  "bookedAppointmentId" TEXT,
  "offeredAt" TIMESTAMP(3),
  "offerExpiresAt" TIMESTAMP(3),
  "offeredSlotDate" DATE,
  "offeredSlotStart" TEXT,
  "offeredSlotEnd" TEXT,
  "offeredProviderId" TEXT,
  "offeredBy" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "notifiedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "closedReason" TEXT,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "waitlist_entries_patientId_idx" ON "waitlist_entries"("patientId");
CREATE INDEX IF NOT EXISTS "waitlist_entries_status_idx" ON "waitlist_entries"("status");
CREATE INDEX IF NOT EXISTS "waitlist_entries_priority_idx" ON "waitlist_entries"("priority");
CREATE INDEX IF NOT EXISTS "waitlist_entries_preferredProviderId_idx" ON "waitlist_entries"("preferredProviderId");
CREATE INDEX IF NOT EXISTS "waitlist_entries_preferredDepartmentId_idx" ON "waitlist_entries"("preferredDepartmentId");
CREATE INDEX IF NOT EXISTS "waitlist_entries_appointmentTypeId_idx" ON "waitlist_entries"("appointmentTypeId");
CREATE INDEX IF NOT EXISTS "waitlist_entries_preferredDateFrom_idx" ON "waitlist_entries"("preferredDateFrom");
CREATE INDEX IF NOT EXISTS "waitlist_entries_preferredDateTo_idx" ON "waitlist_entries"("preferredDateTo");
CREATE INDEX IF NOT EXISTS "waitlist_entries_createdAt_idx" ON "waitlist_entries"("createdAt");

ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_preferredProviderId_fkey"
  FOREIGN KEY ("preferredProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_offeredProviderId_fkey"
  FOREIGN KEY ("offeredProviderId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_preferredDepartmentId_fkey"
  FOREIGN KEY ("preferredDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_appointmentTypeId_fkey"
  FOREIGN KEY ("appointmentTypeId") REFERENCES "appointment_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_sourceAppointmentId_fkey"
  FOREIGN KEY ("sourceAppointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_bookedAppointmentId_fkey"
  FOREIGN KEY ("bookedAppointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "waitlist_events" (
  "id" TEXT NOT NULL,
  "waitlistEntryId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "summary" TEXT,
  "meta" JSONB,
  "createdBy" TEXT,
  "createdByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "waitlist_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "waitlist_events_waitlistEntryId_idx" ON "waitlist_events"("waitlistEntryId");
CREATE INDEX IF NOT EXISTS "waitlist_events_createdAt_idx" ON "waitlist_events"("createdAt");

ALTER TABLE "waitlist_events"
  ADD CONSTRAINT "waitlist_events_waitlistEntryId_fkey"
  FOREIGN KEY ("waitlistEntryId") REFERENCES "waitlist_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
