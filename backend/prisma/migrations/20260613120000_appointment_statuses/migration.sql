-- Appointment status catalogue (labels + colors for scheduling)

CREATE TABLE "appointment_statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_statuses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "appointment_statuses_name_key" ON "appointment_statuses"("name");

INSERT INTO "appointment_statuses" ("id", "name", "color", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid()::text, 'Scheduled', '#3b82f6', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Checked-In', '#ca8a04', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'In Progress', '#9333ea', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Completed', '#16a34a', true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Cancelled', '#dc2626', true, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'No-Show', '#6b7280', true, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Rescheduled', '#ea580c', true, 70, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
