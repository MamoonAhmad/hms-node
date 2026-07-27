-- Add patient SSN (PHI) for registration / demographics
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "ssn" TEXT;
