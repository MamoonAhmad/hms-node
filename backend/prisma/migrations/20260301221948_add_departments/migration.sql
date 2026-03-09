-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "departmentType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "description" TEXT,
    "facilityName" TEXT,
    "building" TEXT,
    "floor" TEXT,
    "roomNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "supportsAppointments" BOOLEAN NOT NULL DEFAULT false,
    "supportsWalkIns" BOOLEAN NOT NULL DEFAULT false,
    "defaultAppointmentDuration" INTEGER,
    "operatingDays" JSONB,
    "startTime" TEXT,
    "endTime" TEXT,
    "departmentHead" TEXT,
    "assignedProviders" JSONB,
    "assignedNurses" JSONB,
    "defaultBillingProvider" TEXT,
    "costCenter" TEXT,
    "revenueCode" TEXT,
    "acceptsInsurance" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_departmentCode_key" ON "departments"("departmentCode");
