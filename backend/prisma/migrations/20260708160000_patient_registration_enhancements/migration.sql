-- Patient registration workflow enhancements
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "noEmail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "militaryBranch" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "disabilities" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "interpreterLanguages" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "visitModality" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "accessibilityRequirements" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "accessibilityRequirementsNotes" TEXT;

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
