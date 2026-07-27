#!/usr/bin/env node
/**
 * One-time backfill: rewrite every patient MRN to MRN000000000001, ...
 * Prefer applying the Prisma migration instead when possible.
 *
 * Usage: node src/scripts/backfillPatientMrns.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const prisma = require('../lib/prisma');

async function main() {
  await prisma.$executeRawUnsafe(`
    UPDATE "patients"
    SET "mrn" = 'TMP-' || "id"
  `);

  const updated = await prisma.$executeRawUnsafe(`
    WITH ordered AS (
      SELECT
        "id",
        ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS seq
      FROM "patients"
    )
    UPDATE "patients" AS p
    SET "mrn" = 'MRN' || LPAD(o.seq::text, 12, '0')
    FROM ordered AS o
    WHERE p."id" = o."id"
  `);

  const sample = await prisma.patient.findMany({
    select: { mrn: true, firstName: true, lastName: true, createdAt: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 10,
  });

  console.log(`Updated ${updated} patient MRN(s). Sample:`);
  for (const p of sample) {
    console.log(`  ${p.mrn}  ${p.firstName} ${p.lastName}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
