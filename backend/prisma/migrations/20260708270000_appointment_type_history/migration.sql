-- Appointment type update history (field-level audit trail)

CREATE TABLE "appointment_type_history" (
    "id" TEXT NOT NULL,
    "appointmentTypeId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT,
    "changes" JSONB,
    "changedBy" TEXT,
    "changedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_type_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_type_history_appointmentTypeId_idx" ON "appointment_type_history"("appointmentTypeId");
CREATE INDEX "appointment_type_history_createdAt_idx" ON "appointment_type_history"("createdAt");

ALTER TABLE "appointment_type_history" ADD CONSTRAINT "appointment_type_history_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "appointment_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
