-- Link beds to patients; remove free-text patient name

ALTER TABLE "beds" DROP COLUMN IF EXISTS "patientName";

ALTER TABLE "beds" ADD COLUMN "patientId" TEXT;

CREATE INDEX "beds_patientId_idx" ON "beds"("patientId");

ALTER TABLE "beds"
  ADD CONSTRAINT "beds_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
