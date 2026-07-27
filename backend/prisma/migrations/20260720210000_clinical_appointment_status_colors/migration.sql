-- Align appointment status catalogue with the clinical 5-tone palette
-- (info / warning / success / danger / muted) — remove purple/orange outliers.

UPDATE "appointment_statuses" SET "color" = '#0f766e', "updatedAt" = CURRENT_TIMESTAMP WHERE "name" = 'Scheduled' AND "deletedAt" IS NULL;
UPDATE "appointment_statuses" SET "color" = '#b45309', "updatedAt" = CURRENT_TIMESTAMP WHERE "name" = 'Checked-In' AND "deletedAt" IS NULL;
UPDATE "appointment_statuses" SET "color" = '#1d4ed8', "updatedAt" = CURRENT_TIMESTAMP WHERE "name" = 'In Progress' AND "deletedAt" IS NULL;
UPDATE "appointment_statuses" SET "color" = '#15803d', "updatedAt" = CURRENT_TIMESTAMP WHERE "name" = 'Completed' AND "deletedAt" IS NULL;
UPDATE "appointment_statuses" SET "color" = '#b91c1c', "updatedAt" = CURRENT_TIMESTAMP WHERE "name" = 'Cancelled' AND "deletedAt" IS NULL;
UPDATE "appointment_statuses" SET "color" = '#64748b', "updatedAt" = CURRENT_TIMESTAMP WHERE "name" = 'No-Show' AND "deletedAt" IS NULL;
UPDATE "appointment_statuses" SET "color" = '#b45309', "updatedAt" = CURRENT_TIMESTAMP WHERE "name" = 'Rescheduled' AND "deletedAt" IS NULL;
