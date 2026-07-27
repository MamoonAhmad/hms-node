-- System flag for built-in appointment types (General is read-only / always available)
ALTER TABLE "appointment_types"
ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- Ensure the default General appointment type exists
INSERT INTO "appointment_types" (
  "id",
  "name",
  "description",
  "defaultTime",
  "isActive",
  "providerRequired",
  "isSystem",
  "sortOrder",
  "createdBy",
  "updatedBy",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'General',
  'Default appointment type available for all providers. Uses a free time picker instead of predefined slots.',
  30,
  true,
  false,
  true,
  0,
  (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1),
  (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "appointment_types"
  WHERE LOWER("name") = 'general' AND "deletedAt" IS NULL
)
AND EXISTS (SELECT 1 FROM "users" LIMIT 1);

-- Mark General as the system type: always available, not provider-restricted
UPDATE "appointment_types"
SET
  "isSystem" = true,
  "providerRequired" = false,
  "isActive" = true,
  "name" = 'General',
  "updatedAt" = NOW()
WHERE LOWER("name") = 'general'
  AND "deletedAt" IS NULL;
