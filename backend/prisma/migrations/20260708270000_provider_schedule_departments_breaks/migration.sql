-- Provider multi-department junction
CREATE TABLE "provider_departments" (
    "providerId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_departments_pkey" PRIMARY KEY ("providerId","departmentId")
);

CREATE INDEX "provider_departments_departmentId_idx" ON "provider_departments"("departmentId");

ALTER TABLE "provider_departments" ADD CONSTRAINT "provider_departments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_departments" ADD CONSTRAINT "provider_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill provider departments from legacy single departmentId
INSERT INTO "provider_departments" ("providerId", "departmentId")
SELECT "id", "departmentId"
FROM "providers"
WHERE "departmentId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Schedule department + break hours
ALTER TABLE "provider_schedules" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "provider_schedules" ADD COLUMN "breakHoursEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "provider_schedules" ADD COLUMN "breakStartTime" TEXT;
ALTER TABLE "provider_schedules" ADD COLUMN "breakEndTime" TEXT;
ALTER TABLE "provider_schedules" ADD COLUMN "breakAppliesTo" TEXT;
ALTER TABLE "provider_schedules" ADD COLUMN "breakDays" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "provider_schedules_departmentId_idx" ON "provider_schedules"("departmentId");

ALTER TABLE "provider_schedules" ADD CONSTRAINT "provider_schedules_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill schedule department from provider's primary department
UPDATE "provider_schedules" ps
SET "departmentId" = p."departmentId"
FROM "providers" p
WHERE ps."providerId" = p."id"
  AND ps."departmentId" IS NULL
  AND p."departmentId" IS NOT NULL;
