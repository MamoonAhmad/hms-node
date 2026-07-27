-- Repair migration: the schema declares
--   appointmentTypeId String  (NOT NULL, FK -> appointment_types.id)
-- but the initial migration created `appointments.appointmentType TEXT NOT NULL`
-- and no migration ever converted the free-text column into a foreign key.
--
-- This migration adds `appointmentTypeId`, backfills it from any existing
-- `appointmentType` values (seeding `appointment_types` rows as needed),
-- enforces NOT NULL + FK, indexes it, and drops the legacy column.

-- 1. Add the new column as nullable so we can backfill safely.
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "appointmentTypeId" TEXT;

-- 2. Seed appointment_types from distinct existing appointmentType values,
--    then backfill appointments.appointmentTypeId.
DO $$
DECLARE
    fallback_user_id TEXT;
    fallback_type_id TEXT;
    legacy_column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'appointments'
          AND column_name = 'appointmentType'
    ) INTO legacy_column_exists;

    IF NOT legacy_column_exists THEN
        RETURN;
    END IF;

    SELECT id INTO fallback_user_id FROM "users" ORDER BY "createdAt" ASC LIMIT 1;

    IF fallback_user_id IS NOT NULL THEN
        INSERT INTO "appointment_types" (
            id, name, "isActive", "sortOrder",
            "createdBy", "updatedBy", "createdAt", "updatedAt"
        )
        SELECT
            gen_random_uuid()::text,
            sub.name,
            true,
            0,
            fallback_user_id,
            fallback_user_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM (
            SELECT DISTINCT NULLIF(TRIM("appointmentType"), '') AS name
            FROM "appointments"
            WHERE "appointmentType" IS NOT NULL
              AND NULLIF(TRIM("appointmentType"), '') IS NOT NULL
        ) sub
        WHERE NOT EXISTS (
            SELECT 1 FROM "appointment_types" t
            WHERE t.name = sub.name AND t."deletedAt" IS NULL
        );
    END IF;

    EXECUTE $sql$
        UPDATE "appointments" a
        SET "appointmentTypeId" = t.id
        FROM "appointment_types" t
        WHERE t.name = TRIM(a."appointmentType")
          AND t."deletedAt" IS NULL
          AND a."appointmentTypeId" IS NULL
    $sql$;

    IF EXISTS (SELECT 1 FROM "appointments" WHERE "appointmentTypeId" IS NULL) THEN
        SELECT id INTO fallback_type_id
        FROM "appointment_types"
        WHERE "deletedAt" IS NULL
        ORDER BY "createdAt" ASC LIMIT 1;

        IF fallback_type_id IS NULL AND fallback_user_id IS NOT NULL THEN
            fallback_type_id := gen_random_uuid()::text;
            INSERT INTO "appointment_types" (
                id, name, "isActive", "sortOrder",
                "createdBy", "updatedBy", "createdAt", "updatedAt"
            ) VALUES (
                fallback_type_id, 'Consultation', true, 0,
                fallback_user_id, fallback_user_id,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
        END IF;

        IF fallback_type_id IS NOT NULL THEN
            UPDATE "appointments"
            SET "appointmentTypeId" = fallback_type_id
            WHERE "appointmentTypeId" IS NULL;
        END IF;
    END IF;
END $$;

-- 3. Enforce constraints. The NOT NULL will succeed when the table is empty
--    or when every row was backfilled above.
ALTER TABLE "appointments" ALTER COLUMN "appointmentTypeId" SET NOT NULL;

ALTER TABLE "appointments"
    DROP CONSTRAINT IF EXISTS "appointments_appointmentTypeId_fkey";
ALTER TABLE "appointments"
    ADD CONSTRAINT "appointments_appointmentTypeId_fkey"
    FOREIGN KEY ("appointmentTypeId") REFERENCES "appointment_types"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "appointments_appointmentTypeId_idx"
    ON "appointments"("appointmentTypeId");

-- 4. Drop the legacy free-text column.
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "appointmentType";
