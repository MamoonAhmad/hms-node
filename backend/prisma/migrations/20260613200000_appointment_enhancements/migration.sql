-- AlterTable
ALTER TABLE "appointments" ADD COLUMN "encounterNumber" TEXT;
ALTER TABLE "appointments" ADD COLUMN "appointmentEndTime" TEXT;
ALTER TABLE "appointments" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "providerId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "createdBy" TEXT;
ALTER TABLE "appointments" ADD COLUMN "updatedBy" TEXT;

-- Backfill encounter numbers for existing rows
UPDATE "appointments"
SET "encounterNumber" = 'ENC-' || UPPER(SUBSTRING(REPLACE(id, '-', ''), 1, 12))
WHERE "encounterNumber" IS NULL;

ALTER TABLE "appointments" ALTER COLUMN "encounterNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "appointments_encounterNumber_key" ON "appointments"("encounterNumber");
CREATE INDEX "appointments_providerId_idx" ON "appointments"("providerId");
CREATE INDEX "appointments_departmentId_idx" ON "appointments"("departmentId");
CREATE INDEX "appointments_appointmentDate_idx" ON "appointments"("appointmentDate");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "appointment_history" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT,
    "changes" JSONB,
    "changedBy" TEXT,
    "changedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_history_appointmentId_idx" ON "appointment_history"("appointmentId");

ALTER TABLE "appointment_history" ADD CONSTRAINT "appointment_history_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
