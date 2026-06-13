-- Remove unused appointment_types.code column

DROP INDEX IF EXISTS "appointment_types_code_key";

ALTER TABLE "appointment_types" DROP COLUMN IF EXISTS "code";
