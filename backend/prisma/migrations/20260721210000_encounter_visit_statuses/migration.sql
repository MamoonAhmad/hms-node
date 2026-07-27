-- Clinical encounter visit statuses (intake → provider → checkout → billing)

WITH seed_user AS (
  SELECT id FROM "users" ORDER BY "createdAt" ASC LIMIT 1
)
INSERT INTO "appointment_statuses" (
  "id", "name", "color", "isActive", "sortOrder",
  "createdBy", "updatedBy", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  v.name,
  v.color,
  true,
  v.sort_order,
  seed_user.id,
  seed_user.id,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  VALUES
    ('In Intake', '#0ea5e9', 25),
    ('With Provider', '#1d4ed8', 35),
    ('Provider Out', '#7c3aed', 45),
    ('Checked Out', '#0891b2', 55),
    ('Visit Completed', '#15803d', 65)
) AS v(name, color, sort_order)
CROSS JOIN seed_user
WHERE NOT EXISTS (
  SELECT 1 FROM "appointment_statuses" s
  WHERE s."name" = v.name AND s."deletedAt" IS NULL
);

-- Align legacy "In Progress" / "Completed" colors with clinical semantics
UPDATE "appointment_statuses"
SET "color" = '#1d4ed8', "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'In Progress' AND "deletedAt" IS NULL;

UPDATE "appointment_statuses"
SET "color" = '#15803d', "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Completed' AND "deletedAt" IS NULL;
