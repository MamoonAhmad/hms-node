-- Sync appointments table with Prisma Appointment model:
-- replace legacy appointmentType text with appointmentTypeId FK,
-- and add tracking-board / room fields.

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "appointmentTypeId" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "roomId" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "chiefComplaint" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "assignedNurseName" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "arrivalTime" TIMESTAMP(3);
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "checkoutStatus" TEXT DEFAULT 'Pending';
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "alertsFlags" JSONB;

-- Map legacy free-text type names to appointment_types rows when possible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'appointmentType'
  ) THEN
    UPDATE "appointments" a
    SET "appointmentTypeId" = (
      SELECT t.id
      FROM "appointment_types" t
      WHERE LOWER(t.name) = LOWER(a."appointmentType")
        AND t."deletedAt" IS NULL
      ORDER BY t."createdAt" ASC
      LIMIT 1
    )
    WHERE a."appointmentTypeId" IS NULL
      AND a."appointmentType" IS NOT NULL;
  END IF;
END $$;

-- Fallback for any remaining rows
UPDATE "appointments"
SET "appointmentTypeId" = (
  SELECT id FROM "appointment_types"
  WHERE "deletedAt" IS NULL
  ORDER BY "createdAt" ASC
  LIMIT 1
)
WHERE "appointmentTypeId" IS NULL;

-- If types catalogue is empty but appointments exist, create a default type
DO $$
DECLARE
  bootstrap_user_id TEXT;
  default_type_id TEXT := '00000000-0000-4000-8000-0000000000a1';
BEGIN
  IF EXISTS (SELECT 1 FROM "appointments" WHERE "appointmentTypeId" IS NULL) THEN
    SELECT id INTO bootstrap_user_id FROM "users" ORDER BY "createdAt" ASC LIMIT 1;
    IF bootstrap_user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot backfill appointmentTypeId: no users exist';
    END IF;

    INSERT INTO "appointment_types" (
      "id", "name", "description", "isActive", "sortOrder",
      "createdBy", "updatedBy", "createdAt", "updatedAt"
    )
    VALUES (
      default_type_id,
      'General',
      'Default appointment type',
      true,
      0,
      bootstrap_user_id,
      bootstrap_user_id,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO NOTHING;

    UPDATE "appointments"
    SET "appointmentTypeId" = default_type_id
    WHERE "appointmentTypeId" IS NULL;
  END IF;
END $$;

ALTER TABLE "appointments" ALTER COLUMN "appointmentTypeId" SET NOT NULL;

ALTER TABLE "appointments" DROP COLUMN IF EXISTS "appointmentType";

CREATE INDEX IF NOT EXISTS "appointments_appointmentTypeId_idx" ON "appointments"("appointmentTypeId");
CREATE INDEX IF NOT EXISTS "appointments_roomId_idx" ON "appointments"("roomId");

ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_appointmentTypeId_fkey";
ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_appointmentTypeId_fkey"
  FOREIGN KEY ("appointmentTypeId") REFERENCES "appointment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_roomId_fkey";
ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
