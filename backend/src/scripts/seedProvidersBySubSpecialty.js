#!/usr/bin/env node
/**
 * Seed 3 active demo providers per existing sub-specialty, then backfill
 * department / taxId / taxonomy / phone / gender on all providers so form
 * dropdowns (gender, department) show valid values.
 *
 * Usage:
 *   node src/scripts/seedProvidersBySubSpecialty.js
 *   node src/scripts/seedProvidersBySubSpecialty.js --enrich-only
 *
 * npm script:
 *   npm run seed:providers-by-subspecialty
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const prisma = require('../lib/prisma');

const FIRST_NAMES = [
  'Ava', 'Noah', 'Mia', 'Liam', 'Emma', 'Oliver', 'Sophia', 'Elijah', 'Isabella', 'James',
  'Amelia', 'Benjamin', 'Harper', 'Lucas', 'Evelyn', 'Henry', 'Abigail', 'Alexander', 'Emily', 'Michael',
  'Elizabeth', 'Daniel', 'Sofia', 'Matthew', 'Avery', 'Samuel', 'Ella', 'David', 'Scarlett', 'Joseph',
  'Grace', 'Carter', 'Chloe', 'Owen', 'Victoria', 'Wyatt', 'Riley', 'John', 'Aria', 'Jack',
  'Lily', 'Luke', 'Aurora', 'Jayden', 'Zoey', 'Dylan', 'Penelope', 'Grayson', 'Layla', 'Levi',
];

const LAST_NAMES = [
  'Anderson', 'Baker', 'Bennett', 'Brooks', 'Campbell', 'Carter', 'Clark', 'Coleman', 'Collins', 'Cook',
  'Cooper', 'Cox', 'Cruz', 'Davis', 'Edwards', 'Evans', 'Foster', 'Garcia', 'Gray', 'Green',
  'Hall', 'Harris', 'Hayes', 'Henderson', 'Hill', 'Howard', 'Hughes', 'Jackson', 'James', 'Jenkins',
  'Johnson', 'Jones', 'Kelly', 'King', 'Lee', 'Lewis', 'Long', 'Lopez', 'Martin', 'Miller',
  'Mitchell', 'Moore', 'Morgan', 'Morris', 'Murphy', 'Myers', 'Nelson', 'Nguyen', 'Ortiz', 'Parker',
];

/** Must match ProviderFormDialog SelectItem values */
const GENDERS = ['male', 'female'];

/** Specialty / sub-specialty keyword → NUCC taxonomy code */
const TAXONOMY_BY_KEYWORD = [
  { match: /interventional cardiology/i, code: '207RI0011X', label: 'Interventional Cardiology' },
  { match: /\bep\b|electrophysiology/i, code: '207RC0001X', label: 'Clinical Cardiac Electrophysiology' },
  { match: /cardiology|pediatric cardiology/i, code: '207RC0000X', label: 'Cardiovascular Disease' },
  { match: /endocrinology/i, code: '207RE0101X', label: 'Endocrinology, Diabetes & Metabolism' },
  { match: /hospital medicine/i, code: '208M00000X', label: 'Hospitalist' },
  { match: /internal medicine/i, code: '207R00000X', label: 'Internal Medicine' },
  { match: /geriatric|family medicine/i, code: '207Q00000X', label: 'Family Medicine' },
  { match: /women'?s health/i, code: '207Q00000X', label: 'Family Medicine' },
  { match: /maternal|high-risk|prenatal/i, code: '207VM0101X', label: 'Maternal & Fetal Medicine' },
  { match: /epilepsy/i, code: '2084E0001X', label: 'Epilepsy' },
  { match: /stroke|neurology/i, code: '2084N0400X', label: 'Neurology' },
  { match: /neonatology/i, code: '2080N0001X', label: 'Neonatal-Perinatal Medicine' },
  { match: /pediatrics/i, code: '208000000X', label: 'Pediatrics' },
];

const SPECIALTY_TO_DEPT = [
  { match: /cardiology/i, dept: /cardiology/i },
  { match: /family medicine/i, dept: /family medicine/i },
  { match: /internal medicine/i, dept: /internal medicine/i },
  { match: /maternal|obstetric/i, dept: /primary care|family medicine/i },
  { match: /neurology/i, dept: /internal medicine|primary care/i },
  { match: /pediatrics/i, dept: /family medicine|primary care/i },
  { match: /dermatology/i, dept: /dermatology/i },
  { match: /pulmonology/i, dept: /pulmonology/i },
];

function npiCheckDigit(nineDigits) {
  const digits = String(nineDigits).padStart(9, '0').slice(0, 9).split('').map(Number);
  const full = [8, 0, 8, 4, 0, ...digits];
  let sum = 0;
  for (let i = full.length - 1, pos = 0; i >= 0; i -= 1, pos += 1) {
    let d = full[i];
    if (pos % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return String((10 - (sum % 10)) % 10);
}

function buildNpi(serial) {
  const body = String(199000000 + serial).padStart(9, '0');
  return body + npiCheckDigit(body);
}

function initials(firstName, lastName) {
  return `${(firstName[0] || '').toUpperCase()}${(lastName[0] || '').toUpperCase()}`;
}

function slugPart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function taxonomyFor(specialtyName, subSpecialtyName) {
  const haystack = `${subSpecialtyName || ''} ${specialtyName || ''}`;
  const hit = TAXONOMY_BY_KEYWORD.find((t) => t.match.test(haystack));
  if (hit) return `${hit.code} — ${hit.label}`;
  return '207Q00000X — Family Medicine';
}

function pickDepartmentId(specialtyName, departments, fallbackId) {
  const rule = SPECIALTY_TO_DEPT.find((r) => r.match.test(specialtyName || ''));
  if (rule) {
    const found = departments.find((d) => rule.dept.test(d.departmentName));
    if (found) return found.id;
  }
  const exact = departments.find(
    (d) => d.departmentName.toLowerCase() === String(specialtyName || '').toLowerCase()
  );
  return exact?.id || fallbackId;
}

function demoTaxId(index) {
  // Fake EIN-style: XX-XXXXXXX
  const prefix = String(10 + (index % 90)).padStart(2, '0');
  const suffix = String(1000000 + (index % 9000000)).padStart(7, '0');
  return `${prefix}-${suffix}`;
}

function demoPhone(index) {
  // Valid US E.164 demo numbers in 617 area (Boston)
  const line = String(2000 + (index % 7000)).padStart(4, '0');
  return `+1617555${line}`;
}

function normalizeGender(value, index) {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'male' || v === 'female') return v;
  if (v === 'm') return 'male';
  if (v === 'f') return 'female';
  return GENDERS[index % GENDERS.length];
}

async function enrichAllProviders(departments) {
  if (!departments.length) {
    console.warn('No departments found — skipping department assignment.');
  }

  const fallbackDeptId = departments[0]?.id || null;
  const providers = await prisma.provider.findMany({
    select: {
      id: true,
      npi: true,
      gender: true,
      specialty: { select: { name: true } },
      subSpecialty: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  let updated = 0;
  for (let i = 0; i < providers.length; i += 1) {
    const p = providers[i];
    const specialtyName = p.specialty?.name || '';
    const subName = p.subSpecialty?.name || '';
    const departmentId = pickDepartmentId(specialtyName, departments, fallbackDeptId);
    const gender = normalizeGender(p.gender, i);
    const taxId = demoTaxId(i + 1);
    const taxonomy = taxonomyFor(specialtyName, subName);
    const mobileNumber = demoPhone(i + 1);

    await prisma.$transaction(async (tx) => {
      await tx.provider.update({
        where: { id: p.id },
        data: {
          gender,
          taxId,
          taxonomy,
          mobileNumber,
          departmentId,
        },
      });

      await tx.providerDepartment.deleteMany({ where: { providerId: p.id } });
      if (departmentId) {
        await tx.providerDepartment.create({
          data: { providerId: p.id, departmentId },
        });
      }
    });
    updated += 1;
  }

  console.log(`Enriched ${updated} provider(s) with department, taxId, taxonomy, phone, gender.`);
}

async function seedProviders(activeLinked, departments) {
  const existingNpis = new Set(
    (await prisma.provider.findMany({ select: { npi: true } })).map((p) => p.npi)
  );

  let serial = 1;
  const nextUniqueNpi = () => {
    let npi;
    do {
      npi = buildNpi(serial);
      serial += 1;
    } while (existingNpis.has(npi));
    existingNpis.add(npi);
    return npi;
  };

  const fallbackDeptId = departments[0]?.id || null;
  let nameIdx = 0;
  const rows = [];

  for (const sub of activeLinked) {
    for (let i = 0; i < 3; i += 1) {
      const firstName = FIRST_NAMES[nameIdx % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(nameIdx + i * 7) % LAST_NAMES.length];
      nameIdx += 1;

      const npi = nextUniqueNpi();
      const emailSlug = `${slugPart(firstName)}.${slugPart(lastName)}.${npi.slice(-4)}`;
      const specialtyName = sub.specialty?.name || '';
      const departmentId = pickDepartmentId(specialtyName, departments, fallbackDeptId);

      rows.push({
        npi,
        firstName,
        lastName,
        initials: initials(firstName, lastName),
        gender: GENDERS[i % GENDERS.length],
        specialtyId: sub.specialtyId,
        subSpecialtyId: sub.id,
        departmentId,
        taxonomy: taxonomyFor(specialtyName, sub.name),
        taxId: demoTaxId(nameIdx),
        email: `${emailSlug}@clinic.demo`,
        mobileNumber: demoPhone(nameIdx),
        city: 'Boston',
        state: 'MA',
        degree: 'MD',
        isActive: true,
      });
    }
  }

  const existingBySub = await prisma.provider.groupBy({
    by: ['subSpecialtyId'],
    where: {
      isActive: true,
      subSpecialtyId: { in: activeLinked.map((s) => s.id) },
    },
    _count: { _all: true },
  });
  const countBySub = new Map(existingBySub.map((r) => [r.subSpecialtyId, r._count._all]));

  const toCreate = [];
  const skippedSubs = [];
  let rowCursor = 0;

  for (const sub of activeLinked) {
    const have = countBySub.get(sub.id) || 0;
    const need = Math.max(0, 3 - have);
    const candidates = rows.slice(rowCursor, rowCursor + 3);
    rowCursor += 3;

    if (need === 0) {
      skippedSubs.push(`${sub.specialty?.name} / ${sub.name} (already has ${have})`);
      continue;
    }
    toCreate.push(...candidates.slice(0, need));
  }

  if (toCreate.length === 0) {
    console.log('Nothing to create — every active sub-specialty already has at least 3 providers.');
  } else {
    for (const row of toCreate) {
      const { departmentId, ...data } = row;
      const created = await prisma.provider.create({ data: { ...data, departmentId } });
      if (departmentId) {
        await prisma.providerDepartment.create({
          data: { providerId: created.id, departmentId },
        });
      }
    }
    console.log(`Created ${toCreate.length} provider(s).`);
  }

  if (skippedSubs.length) {
    console.log(`Skipped ${skippedSubs.length} sub-specialty(ies) already at capacity.`);
  }
}

async function main() {
  const enrichOnly = process.argv.includes('--enrich-only');

  const departments = await prisma.department.findMany({
    where: { status: 'active' },
    select: { id: true, departmentName: true, departmentCode: true },
    orderBy: { departmentName: 'asc' },
  });
  console.log(`Found ${departments.length} active department(s).`);

  if (!enrichOnly) {
    const subSpecialties = await prisma.subSpecialty.findMany({
      where: { isActive: true },
      include: {
        specialty: { select: { id: true, name: true, isActive: true } },
      },
      orderBy: [{ specialty: { name: 'asc' } }, { name: 'asc' }],
    });

    if (subSpecialties.length === 0) {
      console.error('No active sub-specialties found. Seed specialties/sub-specialties first.');
      process.exit(1);
    }

    const activeLinked = subSpecialties.filter((s) => s.specialty?.isActive !== false);
    console.log(`Found ${activeLinked.length} active sub-specialty(ies).`);
    await seedProviders(activeLinked, departments);
  }

  await enrichAllProviders(departments);

  const listing = await prisma.provider.findMany({
    where: { isActive: true },
    select: {
      npi: true,
      firstName: true,
      lastName: true,
      gender: true,
      taxId: true,
      taxonomy: true,
      mobileNumber: true,
      specialty: { select: { name: true } },
      subSpecialty: { select: { name: true } },
      department: { select: { departmentName: true } },
    },
    orderBy: [{ specialty: { name: 'asc' } }, { lastName: 'asc' }],
  });

  console.log(`\nActive providers: ${listing.length}`);
  for (const p of listing) {
    console.log(
      `  ${p.npi}  ${p.firstName} ${p.lastName}  |  ${p.gender}  |  ${p.department?.departmentName || '-'}  |  ${p.taxId}  |  ${p.mobileNumber}  |  ${p.taxonomy}`
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
