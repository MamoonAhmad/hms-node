-- Patient intake records and status tracking

CREATE TABLE "patient_intake_records" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "sectionType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "score" INTEGER,
    "notes" TEXT,
    "isAddendum" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdByName" TEXT,
    "updatedByName" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_intake_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "patient_intake_status" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "certifiedAt" TIMESTAMP(3),
    "certifiedBy" TEXT,
    "certifiedByName" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "completedByName" TEXT,
    "completionNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_intake_status_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "patient_intake_records_patientId_idx" ON "patient_intake_records"("patientId");
CREATE INDEX "patient_intake_records_appointmentId_idx" ON "patient_intake_records"("appointmentId");
CREATE INDEX "patient_intake_records_sectionType_idx" ON "patient_intake_records"("sectionType");
CREATE INDEX "patient_intake_records_parentId_idx" ON "patient_intake_records"("parentId");

CREATE INDEX "patient_intake_status_patientId_idx" ON "patient_intake_status"("patientId");
CREATE INDEX "patient_intake_status_appointmentId_idx" ON "patient_intake_status"("appointmentId");

ALTER TABLE "patient_intake_records" ADD CONSTRAINT "patient_intake_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_intake_records" ADD CONSTRAINT "patient_intake_records_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "patient_intake_records" ADD CONSTRAINT "patient_intake_records_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "patient_intake_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "patient_intake_status" ADD CONSTRAINT "patient_intake_status_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_intake_status" ADD CONSTRAINT "patient_intake_status_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
