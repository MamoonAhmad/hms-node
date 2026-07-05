-- Patient intake sections, completion, and screening scores

CREATE TABLE IF NOT EXISTS "patient_intake_sections" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "sectionKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isAddendum" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdBy" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_intake_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "patient_intake_completions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "certificationAccepted" BOOLEAN NOT NULL DEFAULT false,
    "intakeNotes" TEXT,
    "signedById" TEXT,
    "signedByName" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_intake_completions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "patient_screening_scores" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "screeningType" TEXT NOT NULL,
    "score" INTEGER,
    "maxScore" INTEGER,
    "answers" JSONB NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_screening_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "patient_intake_sections_patientId_idx" ON "patient_intake_sections"("patientId");
CREATE INDEX IF NOT EXISTS "patient_intake_sections_appointmentId_idx" ON "patient_intake_sections"("appointmentId");
CREATE INDEX IF NOT EXISTS "patient_intake_sections_sectionKey_idx" ON "patient_intake_sections"("sectionKey");
CREATE INDEX IF NOT EXISTS "patient_intake_completions_patientId_idx" ON "patient_intake_completions"("patientId");
CREATE INDEX IF NOT EXISTS "patient_intake_completions_appointmentId_idx" ON "patient_intake_completions"("appointmentId");
CREATE INDEX IF NOT EXISTS "patient_screening_scores_patientId_idx" ON "patient_screening_scores"("patientId");
CREATE INDEX IF NOT EXISTS "patient_screening_scores_appointmentId_idx" ON "patient_screening_scores"("appointmentId");
CREATE INDEX IF NOT EXISTS "patient_screening_scores_screeningType_idx" ON "patient_screening_scores"("screeningType");

DO $$ BEGIN
  ALTER TABLE "patient_intake_sections"
    ADD CONSTRAINT "patient_intake_sections_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "patient_intake_completions"
    ADD CONSTRAINT "patient_intake_completions_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "patient_screening_scores"
    ADD CONSTRAINT "patient_screening_scores_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
