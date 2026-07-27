-- Patient document enhancements for dashboard documents tab

ALTER TABLE "patient_documents" ADD COLUMN "title" TEXT;
ALTER TABLE "patient_documents" ADD COLUMN "category" TEXT;
ALTER TABLE "patient_documents" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'Patient Dashboard';
ALTER TABLE "patient_documents" ADD COLUMN "encounterId" TEXT;
ALTER TABLE "patient_documents" ADD COLUMN "description" TEXT;
ALTER TABLE "patient_documents" ADD COLUMN "documentDate" DATE;
ALTER TABLE "patient_documents" ADD COLUMN "expirationDate" DATE;
ALTER TABLE "patient_documents" ADD COLUMN "isConfidential" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patient_documents" ADD COLUMN "patientVisible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patient_documents" ADD COLUMN "tags" JSONB;
ALTER TABLE "patient_documents" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE "patient_documents" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "patient_documents" ADD COLUMN "updatedBy" TEXT;
ALTER TABLE "patient_documents" ADD COLUMN "verifiedBy" TEXT;
ALTER TABLE "patient_documents" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "patient_documents" ADD COLUMN "parentDocumentId" TEXT;
ALTER TABLE "patient_documents" ADD COLUMN "versionNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "patient_documents" ADD COLUMN "replaceReason" TEXT;
ALTER TABLE "patient_documents" ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "patient_documents"
SET
  "title" = COALESCE("documentType", "fileName", 'Document'),
  "category" = 'Other',
  "source" = 'Registration'
WHERE "title" IS NULL;

CREATE INDEX "patient_documents_category_idx" ON "patient_documents"("category");
CREATE INDEX "patient_documents_source_idx" ON "patient_documents"("source");
CREATE INDEX "patient_documents_status_idx" ON "patient_documents"("status");
CREATE INDEX "patient_documents_parentDocumentId_idx" ON "patient_documents"("parentDocumentId");

ALTER TABLE "patient_documents"
  ADD CONSTRAINT "patient_documents_parentDocumentId_fkey"
  FOREIGN KEY ("parentDocumentId") REFERENCES "patient_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
