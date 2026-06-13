-- Soft delete for appointment statuses (name unique among non-deleted rows only)

ALTER TABLE "appointment_statuses" ADD COLUMN "deletedAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "appointment_statuses_name_key";

CREATE UNIQUE INDEX "appointment_statuses_name_not_deleted_key"
  ON "appointment_statuses"("name")
  WHERE "deletedAt" IS NULL;

CREATE INDEX "appointment_statuses_deletedAt_idx" ON "appointment_statuses"("deletedAt");
