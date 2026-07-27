-- Reassign all patient MRNs to MRN000000000001, MRN000000000002, ...
-- Two-step update avoids unique-constraint collisions with existing values.

UPDATE "patients"
SET "mrn" = 'TMP-' || "id";

WITH ordered AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS seq
  FROM "patients"
)
UPDATE "patients" AS p
SET "mrn" = 'MRN' || LPAD(o.seq::text, 12, '0')
FROM ordered AS o
WHERE p."id" = o."id";
