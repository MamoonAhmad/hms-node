-- Chief complaints catalogue + user-specific favourites

CREATE TABLE "chief_complaints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chief_complaints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_chief_complaint_favourites" (
    "userId" TEXT NOT NULL,
    "chiefComplaintId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_chief_complaint_favourites_pkey" PRIMARY KEY ("userId","chiefComplaintId")
);

CREATE UNIQUE INDEX "chief_complaints_name_not_deleted_key"
  ON "chief_complaints"("name")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "chief_complaints_code_not_deleted_key"
  ON "chief_complaints"("code")
  WHERE "deletedAt" IS NULL AND "code" IS NOT NULL;

CREATE INDEX "chief_complaints_name_idx" ON "chief_complaints"("name");
CREATE INDEX "chief_complaints_deletedAt_idx" ON "chief_complaints"("deletedAt");

ALTER TABLE "chief_complaints"
  ADD CONSTRAINT "chief_complaints_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chief_complaints"
  ADD CONSTRAINT "chief_complaints_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chief_complaints"
  ADD CONSTRAINT "chief_complaints_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_chief_complaint_favourites"
  ADD CONSTRAINT "user_chief_complaint_favourites_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_chief_complaint_favourites"
  ADD CONSTRAINT "user_chief_complaint_favourites_chiefComplaintId_fkey"
  FOREIGN KEY ("chiefComplaintId") REFERENCES "chief_complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
