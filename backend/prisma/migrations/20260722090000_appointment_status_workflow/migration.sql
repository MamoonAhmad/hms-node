-- Canonical appointment status workflow:
-- Scheduled, Checked In, In Progress, Checked Out, Completed,
-- Cancelled, No Show, Rescheduled, Left Without Being Seen (LWBS)

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
    ('Scheduled', '#0f766e', 10),
    ('Checked In', '#b45309', 20),
    ('In Progress', '#1d4ed8', 30),
    ('Checked Out', '#0891b2', 40),
    ('Completed', '#15803d', 50),
    ('Cancelled', '#b91c1c', 60),
    ('No Show', '#64748b', 70),
    ('Rescheduled', '#b45309', 80),
    ('Left Without Being Seen (LWBS)', '#9f1239', 90)
) AS v(name, color, sort_order)
CROSS JOIN seed_user
WHERE NOT EXISTS (
  SELECT 1 FROM "appointment_statuses" s
  WHERE s."name" = v.name AND s."deletedAt" IS NULL
);

-- Backfill appointment rows to canonical names
UPDATE "appointments"
SET "status" = 'Checked In', "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" IN ('Checked-In', 'Checked-in');

UPDATE "appointments"
SET "status" = 'No Show', "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" IN ('No-Show', 'Noshow');

UPDATE "appointments"
SET "status" = 'In Progress', "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" IN ('In Intake', 'With Provider', 'Provider Out', 'Arrived', 'Roomed');

UPDATE "appointments"
SET "status" = 'Completed', "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" IN ('Visit Completed', 'Claim Ready');

UPDATE "appointments"
SET "status" = 'Left Without Being Seen (LWBS)', "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" IN ('LWBS', 'Left Without Being Seen');

UPDATE "appointments"
SET "status" = 'Cancelled', "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" IN ('Canceled');

-- Deactivate obsolete granular / legacy catalog rows (keep history rows)
UPDATE "appointment_statuses"
SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "deletedAt" IS NULL
  AND "name" IN (
    'Checked-In',
    'In Intake',
    'With Provider',
    'Provider Out',
    'Visit Completed',
    'No-Show'
  );
