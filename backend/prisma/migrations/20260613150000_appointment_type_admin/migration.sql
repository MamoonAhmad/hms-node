-- Appointment type catalogue (missing from earlier history on fresh DBs)
-- Base shape before defaultTime/deletedAt/audit columns and before code drop.

CREATE TABLE IF NOT EXISTS "appointment_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "appointment_types_name_key" ON "appointment_types"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "appointment_types_code_key" ON "appointment_types"("code");

-- Appointment type admin: optional default time + soft delete

ALTER TABLE "appointment_types" ADD COLUMN IF NOT EXISTS "defaultTime" DOUBLE PRECISION;
ALTER TABLE "appointment_types" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "appointment_types_name_key";

CREATE UNIQUE INDEX IF NOT EXISTS "appointment_types_name_not_deleted_key"
  ON "appointment_types"("name")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "appointment_types_deletedAt_idx" ON "appointment_types"("deletedAt");
