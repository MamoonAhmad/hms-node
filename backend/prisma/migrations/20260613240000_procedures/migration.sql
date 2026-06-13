-- Procedure categories and procedures

CREATE TABLE "procedure_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedure_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "procedures" (
    "id" TEXT NOT NULL,
    "procedureDescription" TEXT NOT NULL,
    "genericDescription" TEXT,
    "departmentId" TEXT,
    "cptCode" TEXT,
    "revenueCode" TEXT,
    "mod1" TEXT,
    "mod2" TEXT,
    "mod3" TEXT,
    "mod4" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "procedure_category_on_procedure" (
    "procedureId" TEXT NOT NULL,
    "procedureCategoryId" TEXT NOT NULL,

    CONSTRAINT "procedure_category_on_procedure_pkey" PRIMARY KEY ("procedureId","procedureCategoryId")
);

CREATE UNIQUE INDEX "procedure_categories_name_not_deleted_key"
  ON "procedure_categories"("name")
  WHERE "deletedAt" IS NULL;

CREATE INDEX "procedure_categories_name_idx" ON "procedure_categories"("name");
CREATE INDEX "procedure_categories_deletedAt_idx" ON "procedure_categories"("deletedAt");
CREATE INDEX "procedures_procedureDescription_idx" ON "procedures"("procedureDescription");
CREATE INDEX "procedures_cptCode_idx" ON "procedures"("cptCode");
CREATE INDEX "procedures_deletedAt_idx" ON "procedures"("deletedAt");

ALTER TABLE "procedure_categories"
  ADD CONSTRAINT "procedure_categories_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "procedure_categories"
  ADD CONSTRAINT "procedure_categories_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "procedure_categories"
  ADD CONSTRAINT "procedure_categories_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "procedures"
  ADD CONSTRAINT "procedures_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "procedures"
  ADD CONSTRAINT "procedures_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "procedures"
  ADD CONSTRAINT "procedures_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "procedures"
  ADD CONSTRAINT "procedures_deletedBy_fkey"
  FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "procedure_category_on_procedure"
  ADD CONSTRAINT "procedure_category_on_procedure_procedureId_fkey"
  FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "procedure_category_on_procedure"
  ADD CONSTRAINT "procedure_category_on_procedure_procedureCategoryId_fkey"
  FOREIGN KEY ("procedureCategoryId") REFERENCES "procedure_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
