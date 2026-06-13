-- Appointment type admin: optional default time + soft delete

ALTER TABLE "appointment_types" ADD COLUMN IF NOT EXISTS "defaultTime" DOUBLE PRECISION;
ALTER TABLE "appointment_types" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "appointment_types_name_key";

CREATE UNIQUE INDEX IF NOT EXISTS "appointment_types_name_not_deleted_key"
  ON "appointment_types"("name")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "appointment_types_deletedAt_idx" ON "appointment_types"("deletedAt");
