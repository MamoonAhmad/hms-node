#!/usr/bin/env node
/**
 * Seed sample diagnosis codes for the administration / diagnosis-codes page.
 *
 * Usage:
 *   node src/scripts/seedDiagnosisCodes.js
 *
 * npm script:
 *   npm run seed:diagnosis
 *
 * Prerequisites: migrations applied and admin user exists (npm run seed:admin).
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const prisma = require('../lib/prisma');

const ADMIN_EMAIL = 'root@localhost';

const DIAGNOSIS_CODES = [
  {
    code: 'J06.9',
    description: 'Acute upper respiratory infection, unspecified',
    effectiveDate: '2025-01-01',
    expiryDate: '2030-12-31',
    isActive: true,
    codingNotes: 'Common diagnosis for viral upper respiratory infections.',
  },
  {
    code: 'E11.9',
    description: 'Type 2 diabetes mellitus without complications',
    effectiveDate: '2025-01-01',
    expiryDate: '2030-12-31',
    isActive: true,
    codingNotes: 'Monitor HbA1c and routine diabetic care.',
  },
  {
    code: 'I10',
    description: 'Essential (primary) hypertension',
    effectiveDate: '2025-01-01',
    expiryDate: '2030-12-31',
    isActive: true,
    codingNotes: 'Primary hypertension without identified secondary cause.',
  },
  {
    code: 'E78.5',
    description: 'Hyperlipidemia, unspecified',
    effectiveDate: '2025-01-01',
    expiryDate: '2030-12-31',
    isActive: true,
    codingNotes: 'Elevated cholesterol requiring monitoring.',
  },
  {
    code: 'J45.909',
    description: 'Unspecified asthma, uncomplicated',
    effectiveDate: '2025-01-01',
    expiryDate: '2030-12-31',
    isActive: true,
    codingNotes: 'Use when asthma severity is not specified.',
  },
  {
    code: 'M54.50',
    description: 'Low back pain, unspecified',
    effectiveDate: '2025-01-01',
    expiryDate: '2030-12-31',
    isActive: true,
    codingNotes: 'Common diagnosis for nonspecific lower back pain.',
  },
  {
    code: 'K21.9',
    description: 'Gastro-esophageal reflux disease without esophagitis',
    effectiveDate: '2025-01-01',
    expiryDate: '2030-12-31',
    isActive: true,
    codingNotes: 'GERD without evidence of esophageal inflammation.',
  },
  {
    code: 'N39.0',
    description: 'Urinary tract infection, site not specified',
    effectiveDate: '2025-01-01',
    expiryDate: '2030-12-31',
    isActive: true,
    codingNotes: 'Confirm with urine culture when appropriate.',
  },
  {
    code: 'R07.9',
    description: 'Chest pain, unspecified',
    effectiveDate: '2025-01-01',
    expiryDate: '2030-12-31',
    isActive: true,
    codingNotes: 'Requires further evaluation to determine underlying cause.',
  },
  {
    code: 'F41.1',
    description: 'Generalized anxiety disorder',
    effectiveDate: '2025-01-01',
    expiryDate: '2030-12-31',
    isActive: true,
    codingNotes: 'Persistent anxiety meeting diagnostic criteria.',
  },
];

async function seedDiagnosisCodes() {
  console.log('Seeding diagnosis codes...\n');

  const admin = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL },
  });

  if (!admin) {
    console.error(`Admin user not found (${ADMIN_EMAIL}). Run: npm run seed:admin`);
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const item of DIAGNOSIS_CODES) {
    const existing = await prisma.diagnosisCode.findFirst({
      where: { code: item.code, deletedAt: null },
    });

    if (existing) {
      console.log(`  skip  ICD ${item.code} (already exists)`);
      skipped += 1;
      continue;
    }

    await prisma.diagnosisCode.create({
      data: {
        code: item.code,
        description: item.description,
        effectiveDate: new Date(item.effectiveDate),
        expiryDate: new Date(item.expiryDate),
        isActive: item.isActive,
        codingNotes: item.codingNotes,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    });

    console.log(`  added ICD ${item.code} — ${item.description}`);
    created += 1;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already present).\n`);
}

seedDiagnosisCodes()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
