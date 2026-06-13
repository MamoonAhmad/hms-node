-- Room type catalogue for patient management / rooms

CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "room_types_code_not_deleted_key"
  ON "room_types"("code")
  WHERE "deletedAt" IS NULL;

CREATE INDEX "room_types_code_idx" ON "room_types"("code");
CREATE INDEX "room_types_isActive_idx" ON "room_types"("isActive");
CREATE INDEX "room_types_deletedAt_idx" ON "room_types"("deletedAt");

ALTER TABLE "room_types"
  ADD CONSTRAINT "room_types_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "room_types"
  ADD CONSTRAINT "room_types_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "room_types"
  ADD CONSTRAINT "room_types_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default room types when at least one user exists
INSERT INTO "room_types" ("id", "code", "label", "isActive", "sortOrder", "createdBy", "updatedBy", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.code, v.label, true, v.sort_order, u.id, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('med_surg', 'Medical / Surgical', 10),
    ('icu', 'ICU', 20),
    ('or', 'OR / Procedure', 30),
    ('ed', 'ED / Observation', 40),
    ('isolation', 'Isolation', 50),
    ('other', 'Other', 60)
) AS v(code, label, sort_order)
CROSS JOIN (SELECT id FROM "users" LIMIT 1) AS u;
