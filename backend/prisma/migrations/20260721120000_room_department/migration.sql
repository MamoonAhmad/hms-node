-- Link rooms to departments (optional)

ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rooms_departmentId_fkey'
  ) THEN
    ALTER TABLE "rooms"
      ADD CONSTRAINT "rooms_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "rooms_departmentId_idx" ON "rooms"("departmentId");
