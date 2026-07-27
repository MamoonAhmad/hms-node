-- Laboratory test master catalogue

CREATE TABLE "lab_tests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "specimenType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lab_tests_code_not_deleted_key"
  ON "lab_tests"("code")
  WHERE "deletedAt" IS NULL;

CREATE INDEX "lab_tests_name_idx" ON "lab_tests"("name");
CREATE INDEX "lab_tests_code_idx" ON "lab_tests"("code");
CREATE INDEX "lab_tests_category_idx" ON "lab_tests"("category");
CREATE INDEX "lab_tests_specimenType_idx" ON "lab_tests"("specimenType");
CREATE INDEX "lab_tests_isActive_idx" ON "lab_tests"("isActive");
CREATE INDEX "lab_tests_createdAt_idx" ON "lab_tests"("createdAt");
CREATE INDEX "lab_tests_deletedAt_idx" ON "lab_tests"("deletedAt");

ALTER TABLE "lab_tests"
  ADD CONSTRAINT "lab_tests_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lab_tests"
  ADD CONSTRAINT "lab_tests_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lab_tests"
  ADD CONSTRAINT "lab_tests_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
