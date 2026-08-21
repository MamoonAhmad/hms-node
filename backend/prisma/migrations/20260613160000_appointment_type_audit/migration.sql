-- Audit fields for appointment types (createdBy / updatedBy / deletedBy)

-- Ensure a user exists for audit backfill (idempotent if earlier migration already created one).
INSERT INTO "users" ("id", "email", "password", "name", "role", "isActive", "createdAt", "updatedAt")
SELECT
  '00000000-0000-4000-8000-000000000001',
  'root@localhost',
  '$2a$10$rWHMteNdfHjQ7c8Z4o63Ke7gN8st7oMXHUwVrXfCCo678OpK4r3Sy',
  'Admin User',
  'admin',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "users" LIMIT 1);

ALTER TABLE "appointment_types" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "appointment_types" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "appointment_types" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

UPDATE "appointment_types"
SET
  "createdBy" = (SELECT id FROM users ORDER BY "createdAt" ASC LIMIT 1),
  "updatedBy" = (SELECT id FROM users ORDER BY "createdAt" ASC LIMIT 1)
WHERE "createdBy" IS NULL OR "updatedBy" IS NULL;

ALTER TABLE "appointment_types" ALTER COLUMN "createdBy" SET NOT NULL;
ALTER TABLE "appointment_types" ALTER COLUMN "updatedBy" SET NOT NULL;

ALTER TABLE "appointment_types"
  DROP CONSTRAINT IF EXISTS "appointment_types_createdBy_fkey";
ALTER TABLE "appointment_types"
  ADD CONSTRAINT "appointment_types_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointment_types"
  DROP CONSTRAINT IF EXISTS "appointment_types_updatedBy_fkey";
ALTER TABLE "appointment_types"
  ADD CONSTRAINT "appointment_types_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointment_types"
  DROP CONSTRAINT IF EXISTS "appointment_types_deletedBy_fkey";
ALTER TABLE "appointment_types"
  ADD CONSTRAINT "appointment_types_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
