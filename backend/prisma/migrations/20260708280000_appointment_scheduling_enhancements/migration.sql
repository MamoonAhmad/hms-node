-- Appointment scheduling enhancements: event status, rooming, visit modality, accessibility
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "visitModality" TEXT DEFAULT 'in-house';
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "accessibilityRequirements" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "accessibilityRequirementsNotes" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "eventStatus" TEXT NOT NULL DEFAULT 'Scheduled';
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "roomId" TEXT;

ALTER TABLE "appointment_history" ADD COLUMN IF NOT EXISTS "changedByRole" TEXT;

CREATE INDEX IF NOT EXISTS "appointments_eventStatus_idx" ON "appointments"("eventStatus");
CREATE INDEX IF NOT EXISTS "appointments_roomId_idx" ON "appointments"("roomId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_roomId_fkey'
  ) THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_roomId_fkey"
      FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Seed General appointment type if missing
INSERT INTO "appointment_types" ("id", "name", "defaultTime", "createdBy", "updatedBy", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'General',
  30,
  (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1),
  (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "appointment_types"
  WHERE LOWER("name") = 'general' AND "deletedAt" IS NULL
);
