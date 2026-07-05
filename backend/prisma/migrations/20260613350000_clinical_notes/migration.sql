CREATE TABLE IF NOT EXISTS "patient_clinical_notes" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "noteType" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "content" JSONB NOT NULL,
    "diagnoses" JSONB NOT NULL DEFAULT '[]',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "providerId" TEXT,
    "providerName" TEXT,
    "location" TEXT,
    "signedById" TEXT,
    "signedByName" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdByName" TEXT,
    "updatedBy" TEXT,
    "updatedByName" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_clinical_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "patient_clinical_note_addendums" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "diagnoses" JSONB NOT NULL DEFAULT '[]',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "signedById" TEXT,
    "signedByName" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_clinical_note_addendums_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "patient_clinical_notes_patientId_idx" ON "patient_clinical_notes"("patientId");
CREATE INDEX IF NOT EXISTS "patient_clinical_notes_appointmentId_idx" ON "patient_clinical_notes"("appointmentId");
CREATE INDEX IF NOT EXISTS "patient_clinical_notes_noteType_idx" ON "patient_clinical_notes"("noteType");
CREATE INDEX IF NOT EXISTS "patient_clinical_notes_status_idx" ON "patient_clinical_notes"("status");
CREATE INDEX IF NOT EXISTS "patient_clinical_notes_isDeleted_idx" ON "patient_clinical_notes"("isDeleted");
CREATE INDEX IF NOT EXISTS "patient_clinical_note_addendums_noteId_idx" ON "patient_clinical_note_addendums"("noteId");

DO $$ BEGIN
  ALTER TABLE "patient_clinical_notes"
    ADD CONSTRAINT "patient_clinical_notes_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "patient_clinical_note_addendums"
    ADD CONSTRAINT "patient_clinical_note_addendums_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "patient_clinical_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
