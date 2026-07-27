#!/usr/bin/env node
/**
 * Seed sample procedure codes for the administration / procedure-codes page.
 *
 * Usage:
 *   node src/scripts/seedProcedureCodes.js
 *
 * npm script:
 *   npm run seed:procedures
 *
 * Prerequisites: migrations applied and admin user exists (npm run seed:admin).
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const prisma = require('../lib/prisma');

const ADMIN_EMAIL = 'root@localhost';

const PROCEDURE_CATEGORIES = [
  'Evaluation & Management',
  'Cardiology',
  'Radiology',
  'Laboratory',
  'Immunization',
  'Procedure',
  'Pulmonology',
  'Dermatology',
];

const DEPARTMENTS = [
  { name: 'Family Medicine', code: 'FAM-MED' },
  { name: 'Internal Medicine', code: 'INT-MED' },
  { name: 'Cardiology', code: 'CARD' },
  { name: 'Radiology', code: 'RAD' },
  { name: 'Laboratory', code: 'LAB' },
  { name: 'Primary Care', code: 'PRI-CARE' },
  { name: 'ENT', code: 'ENT' },
  { name: 'Pulmonology', code: 'PULM' },
  { name: 'Dermatology', code: 'DERM' },
];

const PROCEDURE_CODES = [
  {
    procedureDescription: 'Office visit for new patient, moderate complexity',
    genericDescription: 'New patient evaluation and management',
    category: 'Evaluation & Management',
    department: 'Family Medicine',
    cptCode: '99204',
    revenueCode: '0510',
    mod1: '25',
  },
  {
    procedureDescription: 'Office visit for established patient',
    genericDescription: 'Established patient follow-up',
    category: 'Evaluation & Management',
    department: 'Internal Medicine',
    cptCode: '99213',
    revenueCode: '0510',
    mod1: '25',
  },
  {
    procedureDescription: 'Routine electrocardiogram with interpretation',
    genericDescription: 'ECG',
    category: 'Cardiology',
    department: 'Cardiology',
    cptCode: '93000',
    revenueCode: '0730',
    mod1: 'TC',
    mod2: '26',
  },
  {
    procedureDescription: 'Chest X-ray, two views',
    genericDescription: 'Chest radiography',
    category: 'Radiology',
    department: 'Radiology',
    cptCode: '71046',
    revenueCode: '0320',
    mod1: 'TC',
    mod2: '26',
  },
  {
    procedureDescription: 'Complete blood count with automated differential',
    genericDescription: 'CBC with differential',
    category: 'Laboratory',
    department: 'Laboratory',
    cptCode: '85025',
    revenueCode: '0300',
    mod1: '91',
  },
  {
    procedureDescription: 'Comprehensive metabolic panel',
    genericDescription: 'CMP',
    category: 'Laboratory',
    department: 'Laboratory',
    cptCode: '80053',
    revenueCode: '0301',
    mod1: '91',
  },
  {
    procedureDescription: 'Influenza virus vaccine administration',
    genericDescription: 'Flu vaccination',
    category: 'Immunization',
    department: 'Primary Care',
    cptCode: '90686',
    revenueCode: '0636',
    mod1: 'SL',
  },
  {
    procedureDescription: 'Removal of impacted ear wax',
    genericDescription: 'Ear irrigation',
    category: 'Procedure',
    department: 'ENT',
    cptCode: '69209',
    revenueCode: '0450',
    mod1: '50',
  },
  {
    procedureDescription: 'Spirometry with graphic record',
    genericDescription: 'Pulmonary function testing',
    category: 'Pulmonology',
    department: 'Pulmonology',
    cptCode: '94010',
    revenueCode: '0470',
    mod1: '26',
  },
  {
    procedureDescription: 'Punch biopsy of single skin lesion',
    genericDescription: 'Skin biopsy',
    category: 'Dermatology',
    department: 'Dermatology',
    cptCode: '11104',
    revenueCode: '0360',
    mod1: '59',
  },
];

async function findOrCreateCategory(name, userId) {
  const existing = await prisma.procedureCategory.findFirst({
    where: { name, deletedAt: null },
  });
  if (existing) return existing;

  return prisma.procedureCategory.create({
    data: {
      name,
      createdBy: userId,
      updatedBy: userId,
    },
  });
}

async function findOrCreateDepartment({ name, code }) {
  const existing = await prisma.department.findFirst({
    where: { departmentName: name },
  });
  if (existing) return existing;

  return prisma.department.create({
    data: {
      departmentName: name,
      departmentCode: code,
      status: 'active',
    },
  });
}

async function seedProcedureCodes() {
  console.log('Seeding procedure codes...\n');

  const admin = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL },
  });

  if (!admin) {
    console.error(`Admin user not found (${ADMIN_EMAIL}). Run: npm run seed:admin`);
    process.exit(1);
  }

  const categoryMap = {};
  for (const name of PROCEDURE_CATEGORIES) {
    const row = await findOrCreateCategory(name, admin.id);
    categoryMap[name] = row.id;
  }

  const departmentMap = {};
  for (const dept of DEPARTMENTS) {
    const row = await findOrCreateDepartment(dept);
    departmentMap[dept.name] = row.id;
  }

  let created = 0;
  let skipped = 0;

  for (const item of PROCEDURE_CODES) {
    const existing = await prisma.procedure.findFirst({
      where: { cptCode: item.cptCode, deletedAt: null },
    });

    if (existing) {
      console.log(`  skip  CPT ${item.cptCode} (already exists)`);
      skipped += 1;
      continue;
    }

    const procedure = await prisma.procedure.create({
      data: {
        procedureDescription: item.procedureDescription,
        genericDescription: item.genericDescription,
        departmentId: departmentMap[item.department] || null,
        cptCode: item.cptCode,
        revenueCode: item.revenueCode,
        mod1: item.mod1 || null,
        mod2: item.mod2 || null,
        mod3: item.mod3 || null,
        mod4: item.mod4 || null,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    });

    await prisma.procedureCategoryOnProcedure.create({
      data: {
        procedureId: procedure.id,
        procedureCategoryId: categoryMap[item.category],
      },
    });

    console.log(`  added CPT ${item.cptCode} — ${item.procedureDescription}`);
    created += 1;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already present).\n`);
}

seedProcedureCodes()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
