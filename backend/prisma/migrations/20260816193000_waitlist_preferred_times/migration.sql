-- Preferred schedule slot times on waitlist entries
ALTER TABLE "waitlist_entries"
  ADD COLUMN IF NOT EXISTS "preferredTimes" JSONB;
