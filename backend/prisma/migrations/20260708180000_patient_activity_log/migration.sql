CREATE TABLE IF NOT EXISTS "patient_activity_logs" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "section" TEXT,
    "tabName" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "userRole" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "patient_activity_logs_patientId_idx" ON "patient_activity_logs"("patientId");
CREATE INDEX IF NOT EXISTS "patient_activity_logs_createdAt_idx" ON "patient_activity_logs"("createdAt");

ALTER TABLE "patient_activity_logs"
  ADD CONSTRAINT "patient_activity_logs_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
