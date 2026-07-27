-- Restrict appointment types so they only appear for providers whose
-- schedule includes the type (not in the global "all providers" catalog).
ALTER TABLE "appointment_types"
ADD COLUMN "providerRequired" BOOLEAN NOT NULL DEFAULT false;
