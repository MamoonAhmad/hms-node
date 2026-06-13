-- CreateTable
CREATE TABLE "provider_schedules" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "days" TEXT[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL,
    "maxAppointmentsPerSlot" INTEGER NOT NULL DEFAULT 1,
    "overBooking" INTEGER NOT NULL DEFAULT 0,
    "effectiveStartDate" DATE NOT NULL,
    "effectiveEndDate" DATE,
    "endOnEffectiveDate" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "teleconsultationAllowed" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_schedule_locations" (
    "scheduleId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "provider_schedule_locations_pkey" PRIMARY KEY ("scheduleId","locationId")
);

-- CreateTable
CREATE TABLE "provider_schedule_appointment_types" (
    "scheduleId" TEXT NOT NULL,
    "appointmentTypeId" TEXT NOT NULL,

    CONSTRAINT "provider_schedule_appointment_types_pkey" PRIMARY KEY ("scheduleId","appointmentTypeId")
);

-- CreateIndex
CREATE INDEX "provider_schedules_providerId_idx" ON "provider_schedules"("providerId");

-- CreateIndex
CREATE INDEX "provider_schedules_deletedAt_idx" ON "provider_schedules"("deletedAt");

-- CreateIndex
CREATE INDEX "provider_schedules_effectiveStartDate_idx" ON "provider_schedules"("effectiveStartDate");

-- AddForeignKey
ALTER TABLE "provider_schedules" ADD CONSTRAINT "provider_schedules_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_schedule_locations" ADD CONSTRAINT "provider_schedule_locations_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "provider_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_schedule_locations" ADD CONSTRAINT "provider_schedule_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_schedule_appointment_types" ADD CONSTRAINT "provider_schedule_appointment_types_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "provider_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_schedule_appointment_types" ADD CONSTRAINT "provider_schedule_appointment_types_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "appointment_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
