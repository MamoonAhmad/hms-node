-- Repair migration: the original CREATE TABLE for "appointment_types" was
-- missing from the migration history. The migrations that follow this one
-- (20260613150000_appointment_type_admin, 20260613160000_appointment_type_audit,
-- 20260613170000_drop_appointment_type_code, 20260613180000_provider_schedules)
-- all assume the table already exists, so without this migration deploy fails
-- with `42P01: relation "appointment_types" does not exist`.
--
-- The shape below matches the pre-150000 state expected by those follow-up
-- migrations: it includes a `code` column + unique index (dropped by 170000)
-- and the base columns prior to defaultTime / deletedAt / audit fields being
-- added by 150000 and 160000.

CREATE TABLE "appointment_types" (
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

CREATE UNIQUE INDEX "appointment_types_name_key" ON "appointment_types"("name");
CREATE UNIQUE INDEX "appointment_types_code_key" ON "appointment_types"("code");
