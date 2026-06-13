-- Audit fields for appointment statuses (createdBy / updatedBy / deletedBy)

ALTER TABLE "appointment_statuses" ADD COLUMN "createdBy" TEXT;
ALTER TABLE "appointment_statuses" ADD COLUMN "updatedBy" TEXT;
ALTER TABLE "appointment_statuses" ADD COLUMN "deletedBy" TEXT;

UPDATE "appointment_statuses"
SET
  "createdBy" = (SELECT id FROM users ORDER BY "createdAt" ASC LIMIT 1),
  "updatedBy" = (SELECT id FROM users ORDER BY "createdAt" ASC LIMIT 1)
WHERE "createdBy" IS NULL;

ALTER TABLE "appointment_statuses" ALTER COLUMN "createdBy" SET NOT NULL;
ALTER TABLE "appointment_statuses" ALTER COLUMN "updatedBy" SET NOT NULL;

ALTER TABLE "appointment_statuses"
  ADD CONSTRAINT "appointment_statuses_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointment_statuses"
  ADD CONSTRAINT "appointment_statuses_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointment_statuses"
  ADD CONSTRAINT "appointment_statuses_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
