-- AlterTable
ALTER TABLE "patient_checkouts"
  ADD COLUMN IF NOT EXISTS "worklistRemovedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "worklistAssignedToId" TEXT,
  ADD COLUMN IF NOT EXISTS "worklistAssignedToName" TEXT,
  ADD COLUMN IF NOT EXISTS "worklistDocStatus" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "patient_checkouts_worklistRemovedAt_idx" ON "patient_checkouts"("worklistRemovedAt");
