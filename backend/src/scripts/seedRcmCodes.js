#!/usr/bin/env node
/**
 * Seed ICD-10, HCPCS Level II, CPT / procedure, and charge-master prices.
 *
 * Safe to re-run: upserts by code. Does not wipe other data.
 *
 * Usage:
 *   node src/scripts/seedRcmCodes.js
 *   npm run seed:rcm-codes
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const prisma = require('../lib/prisma');
const { deriveIcdChapter, deriveHcpcsCategory, splitProcedureCode } = require('../lib/codeCatalog');

const CATEGORIES = [
  'Evaluation and Management',
  'Preventive Medicine',
  'Laboratory',
  'Radiology',
  'Medicine',
  'Surgery',
  'Pathology',
  'Immunization',
  'DME and Supplies',
  'Drugs and Injections',
];

const DIAGNOSES = [
  ['Z00.00', 'Encounter for general adult medical examination without abnormal findings', 'Adult wellness exam', true, 'Z00-Z99', false],
  ['Z00.129', 'Encounter for routine child health examination without abnormal findings', 'Child wellness exam', true, 'Z00-Z99', false],
  ['Z23', 'Encounter for immunization', 'Immunization encounter', true, 'Z00-Z99', false],
  ['Z12.31', 'Encounter for screening mammogram for malignant neoplasm of breast', 'Mammogram screening', true, 'Z00-Z99', false],
  ['Z13.1', 'Encounter for screening for diabetes mellitus', 'Diabetes screening', true, 'Z00-Z99', false],
  ['Z79.4', 'Long term (current) use of insulin', 'Long-term insulin', true, 'Z00-Z99', false],
  ['Z87.891', 'Personal history of nicotine dependence', 'History of nicotine', true, 'Z00-Z99', false],
  ['Z51.11', 'Encounter for antineoplastic chemotherapy', 'Chemo encounter', true, 'Z00-Z99', false],
  ['E11.9', 'Type 2 diabetes mellitus without complications', 'T2DM w/o complications', true, 'E00-E89', true],
  ['E11.65', 'Type 2 diabetes mellitus with hyperglycemia', 'T2DM with hyperglycemia', true, 'E00-E89', false],
  ['E78.5', 'Hyperlipidemia, unspecified', 'Hyperlipidemia', true, 'E00-E89', true],
  ['E66.9', 'Obesity, unspecified', 'Obesity', true, 'E00-E89', true],
  ['I10', 'Essential (primary) hypertension', 'Hypertension', true, 'I00-I99', false],
  ['I25.10', 'Atherosclerotic heart disease of native coronary artery without angina pectoris', 'CAD without angina', true, 'I00-I99', false],
  ['I48.91', 'Unspecified atrial fibrillation', 'Atrial fibrillation', true, 'I00-I99', true],
  ['I50.9', 'Heart failure, unspecified', 'Heart failure', true, 'I00-I99', true],
  ['J06.9', 'Acute upper respiratory infection, unspecified', 'URI', true, 'J00-J99', true],
  ['J18.9', 'Pneumonia, unspecified organism', 'Pneumonia', true, 'J00-J99', true],
  ['J44.1', 'Chronic obstructive pulmonary disease with (acute) exacerbation', 'COPD exacerbation', true, 'J00-J99', false],
  ['J45.909', 'Unspecified asthma, uncomplicated', 'Asthma', true, 'J00-J99', true],
  ['K21.9', 'Gastro-esophageal reflux disease without esophagitis', 'GERD', true, 'K00-K95', false],
  ['M54.5', 'Low back pain', 'Low back pain', true, 'M00-M99', false],
  ['M25.561', 'Pain in right knee', 'Right knee pain', true, 'M00-M99', false],
  ['N18.30', 'Chronic kidney disease, stage 3 unspecified', 'CKD stage 3', true, 'N00-N99', true],
  ['N39.0', 'Urinary tract infection, site not specified', 'UTI', true, 'N00-N99', true],
  ['R05.9', 'Cough, unspecified', 'Cough', true, 'R00-R99', true],
  ['R07.9', 'Chest pain, unspecified', 'Chest pain', true, 'R00-R99', true],
  ['R10.9', 'Unspecified abdominal pain', 'Abdominal pain', true, 'R00-R99', true],
  ['R51.9', 'Headache, unspecified', 'Headache', true, 'R00-R99', true],
  ['R53.83', 'Other fatigue', 'Fatigue', true, 'R00-R99', false],
  ['F32.9', 'Major depressive disorder, single episode, unspecified', 'Depression', true, 'F01-F99', true],
  ['F41.9', 'Anxiety disorder, unspecified', 'Anxiety', true, 'F01-F99', true],
  ['G47.33', 'Obstructive sleep apnea (adult) (pediatric)', 'OSA', true, 'G00-G99', false],
];

const HCPCS = [
  ['J1885', 'Injection, ketorolac tromethamine, per 15 mg', 'Ketorolac 15 mg', 18.5, 'J', true, false, '0636'],
  ['J0696', 'Injection, ceftriaxone sodium, per 250 mg', 'Ceftriaxone 250 mg', 22.0, 'J', true, false, '0636'],
  ['J1100', 'Injection, dexamethasone sodium phosphate, 1 mg', 'Dexamethasone 1 mg', 6.5, 'J', true, false, '0636'],
  ['J3420', 'Injection, vitamin B-12 cyanocobalamin, up to 1000 mcg', 'Vitamin B12', 12.0, 'J', true, false, '0636'],
  ['J0585', 'Injection, onabotulinumtoxinA, 1 unit', 'Botox 1 unit', 6.8, 'J', true, true, '0636'],
  ['G0008', 'Administration of influenza virus vaccine', 'Flu vaccine admin', 32.0, 'G', true, false, '0771'],
  ['G0439', 'Annual wellness visit, subsequent visit', 'AWV subsequent', 195.0, 'G', true, false, '0510'],
  ['Q0091', 'Screening Papanicolaou smear; obtaining, preparing and conveyance', 'Pap collection', 48.0, 'Q', true, false, '0311'],
  ['A0428', 'Ambulance service, basic life support, non-emergency transport', 'BLS ambulance', 425.0, 'A', true, false, '0540'],
  ['A0425', 'Ground mileage, per statute mile', 'Ambulance mileage', 12.5, 'A', true, false, '0540'],
  ['A4550', 'Surgical trays', 'Surgical tray', 35.0, 'A', true, false, '0272'],
  ['A9270', 'Non-covered item or service', 'Non-covered item', 0, 'A', false, false, '0270'],
  ['E0601', 'Continuous positive airway pressure (CPAP) device', 'CPAP device', 850.0, 'E', true, false, '0292'],
  ['E1390', 'Oxygen concentrator, single delivery port', 'Oxygen concentrator', 275.0, 'E', true, false, '0277'],
  ['L1833', 'Knee orthosis, adjustable, prefabricated', 'Knee brace', 145.0, 'L', true, false, '0274'],
  ['V2020', 'Frames, purchases', 'Eyeglass frames', 95.0, 'V', true, false, '0274'],
];

const PROCEDURES = [
  { cpt: '99202', desc: 'Office/outpatient visit, new patient, straightforward MDM', cat: 'Evaluation and Management', rev: '0510', price: 165, pos: '11', rvu: 0.93, global: 'XXX' },
  { cpt: '99203', desc: 'Office/outpatient visit, new patient, low MDM', cat: 'Evaluation and Management', rev: '0510', price: 225, pos: '11', rvu: 1.6, global: 'XXX' },
  { cpt: '99204', desc: 'Office/outpatient visit, new patient, moderate MDM', cat: 'Evaluation and Management', rev: '0510', price: 335, pos: '11', rvu: 2.6, global: 'XXX' },
  { cpt: '99205', desc: 'Office/outpatient visit, new patient, high MDM', cat: 'Evaluation and Management', rev: '0510', price: 425, pos: '11', rvu: 3.5, global: 'XXX' },
  { cpt: '99212', desc: 'Office/outpatient visit, established patient, straightforward MDM', cat: 'Evaluation and Management', rev: '0510', price: 115, pos: '11', rvu: 0.7, global: 'XXX' },
  { cpt: '99213', desc: 'Office/outpatient visit, established patient, low MDM', cat: 'Evaluation and Management', rev: '0510', price: 185, pos: '11', rvu: 1.3, global: 'XXX' },
  { cpt: '99214', desc: 'Office/outpatient visit, established patient, moderate MDM', cat: 'Evaluation and Management', rev: '0510', price: 265, pos: '11', rvu: 1.92, global: 'XXX' },
  { cpt: '99215', desc: 'Office/outpatient visit, established patient, high MDM', cat: 'Evaluation and Management', rev: '0510', price: 355, pos: '11', rvu: 2.8, global: 'XXX' },
  { cpt: '99281', desc: 'Emergency department visit, may not require physician', cat: 'Evaluation and Management', rev: '0450', price: 145, pos: '23', rvu: 0.48, global: 'XXX' },
  { cpt: '99283', desc: 'Emergency department visit, moderate severity', cat: 'Evaluation and Management', rev: '0450', price: 285, pos: '23', rvu: 1.6, global: 'XXX' },
  { cpt: '99284', desc: 'Emergency department visit, high severity', cat: 'Evaluation and Management', rev: '0450', price: 425, pos: '23', rvu: 2.6, global: 'XXX' },
  { cpt: '99285', desc: 'Emergency department visit, high severity, threat to life', cat: 'Evaluation and Management', rev: '0450', price: 620, pos: '23', rvu: 3.8, global: 'XXX' },
  { cpt: '99391', desc: 'Periodic comprehensive preventive medicine, infant < 1 year', cat: 'Preventive Medicine', rev: '0510', price: 165, pos: '11', rvu: 1.37, global: 'XXX' },
  { cpt: '99392', desc: 'Periodic comprehensive preventive medicine, age 1–4 years', cat: 'Preventive Medicine', rev: '0510', price: 175, pos: '11', rvu: 1.5, global: 'XXX' },
  { cpt: '99395', desc: 'Periodic comprehensive preventive medicine, age 18–39 years', cat: 'Preventive Medicine', rev: '0510', price: 210, pos: '11', rvu: 1.75, global: 'XXX' },
  { cpt: '99396', desc: 'Periodic comprehensive preventive medicine, age 40–64 years', cat: 'Preventive Medicine', rev: '0510', price: 225, pos: '11', rvu: 1.9, global: 'XXX' },
  { cpt: '99397', desc: 'Periodic comprehensive preventive medicine, age 65+ years', cat: 'Preventive Medicine', rev: '0510', price: 240, pos: '11', rvu: 2.0, global: 'XXX' },
  { cpt: '80053', desc: 'Comprehensive metabolic panel', cat: 'Laboratory', rev: '0300', price: 48, pos: '11', rvu: 0, global: 'XXX' },
  { cpt: '80061', desc: 'Lipid panel', cat: 'Laboratory', rev: '0300', price: 42, pos: '11', rvu: 0, global: 'XXX' },
  { cpt: '85025', desc: 'Complete blood count (CBC) with automated differential', cat: 'Laboratory', rev: '0300', price: 28, pos: '11', rvu: 0, global: 'XXX' },
  { cpt: '83036', desc: 'Hemoglobin A1c', cat: 'Laboratory', rev: '0300', price: 32, pos: '11', rvu: 0, global: 'XXX' },
  { cpt: '81001', desc: 'Urinalysis, automated with microscopy', cat: 'Laboratory', rev: '0300', price: 18, pos: '11', rvu: 0, global: 'XXX' },
  { cpt: '36415', desc: 'Collection of venous blood by venipuncture', cat: 'Laboratory', rev: '0301', price: 12, pos: '11', rvu: 0, global: 'XXX' },
  { cpt: '71045', desc: 'Radiologic examination, chest; single view', cat: 'Radiology', rev: '0320', price: 95, pos: '11', rvu: 0.18, global: 'XXX' },
  { cpt: '71046', desc: 'Radiologic examination, chest; 2 views', cat: 'Radiology', rev: '0320', price: 125, pos: '11', rvu: 0.22, global: 'XXX' },
  { cpt: '73030', desc: 'Radiologic examination, shoulder; complete, minimum of 2 views', cat: 'Radiology', rev: '0320', price: 110, pos: '11', rvu: 0.18, global: 'XXX' },
  { cpt: '93000', desc: 'Electrocardiogram, routine ECG with at least 12 leads; with interpretation', cat: 'Medicine', rev: '0730', price: 55, pos: '11', rvu: 0.17, global: 'XXX' },
  { cpt: '94010', desc: 'Spirometry, including graphic record', cat: 'Medicine', rev: '0460', price: 68, pos: '11', rvu: 0.17, global: 'XXX' },
  { cpt: '94640', desc: 'Pressurized or nonpressurized inhalation treatment', cat: 'Medicine', rev: '0410', price: 45, pos: '11', rvu: 0, global: 'XXX' },
  { cpt: '96372', desc: 'Therapeutic, prophylactic, or diagnostic injection; subcutaneous or intramuscular', cat: 'Medicine', rev: '0260', price: 38, pos: '11', rvu: 0.17, global: 'XXX' },
  { cpt: '90471', desc: 'Immunization administration, 1 vaccine', cat: 'Immunization', rev: '0771', price: 32, pos: '11', rvu: 0.17, global: 'XXX' },
  { cpt: '90472', desc: 'Immunization administration, each additional vaccine', cat: 'Immunization', rev: '0771', price: 18, pos: '11', rvu: 0.12, global: 'XXX', addOn: true },
  { cpt: '20610', desc: 'Arthrocentesis, aspiration and/or injection, major joint or bursa', cat: 'Surgery', rev: '0360', price: 185, pos: '11', rvu: 0.79, global: '000' },
  { cpt: '11102', desc: 'Tangential biopsy of skin; single lesion', cat: 'Surgery', rev: '0360', price: 145, pos: '11', rvu: 0.66, global: '000' },
  { cpt: '17000', desc: 'Destruction of premalignant lesion; first lesion', cat: 'Surgery', rev: '0360', price: 125, pos: '11', rvu: 0.61, global: '010' },
  { cpt: '45378', desc: 'Colonoscopy, flexible; diagnostic', cat: 'Surgery', rev: '0750', price: 1250, pos: '22', rvu: 3.36, global: '000' },
  { cpt: '43239', desc: 'Esophagogastroduodenoscopy, flexible; with biopsy', cat: 'Surgery', rev: '0750', price: 980, pos: '22', rvu: 2.39, global: '000' },
  { cpt: 'G0439', desc: 'Annual wellness visit; subsequent visit', cat: 'Preventive Medicine', rev: '0510', price: 195, pos: '11', rvu: 1.92, global: 'XXX', codeType: 'HCPCS' },
];

async function resolveUserId() {
  const admin = await prisma.user.findFirst({
    where: { OR: [{ role: 'admin' }, { email: 'root@localhost' }] },
    orderBy: { createdAt: 'asc' },
  });
  if (admin) return admin.id;
  const any = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!any) {
    throw new Error('No users found. Create an admin user before seeding RCM codes.');
  }
  return any.id;
}

async function upsertCategory(name, userId) {
  const existing = await prisma.procedureCategory.findFirst({
    where: { name, deletedAt: null },
  });
  if (existing) return existing;
  return prisma.procedureCategory.create({
    data: { name, createdBy: userId, updatedBy: userId },
  });
}

async function seedDiagnoses(userId) {
  let created = 0;
  let updated = 0;
  for (const [code, description, shortDescription, isBillable, chapter, isUnspecified] of DIAGNOSES) {
    const existing = await prisma.diagnosisCode.findFirst({
      where: { code, deletedAt: null },
    });
    const data = {
      code,
      description,
      shortDescription,
      chapter: chapter || deriveIcdChapter(code),
      isBillable,
      isUnspecified,
      isActive: true,
      laterality: code.includes('561') ? 'right' : 'none',
      updatedBy: userId,
    };
    if (existing) {
      await prisma.diagnosisCode.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.diagnosisCode.create({
        data: { ...data, createdBy: userId },
      });
      created += 1;
    }
  }
  return { created, updated };
}

async function seedHcpcs(userId) {
  let created = 0;
  let updated = 0;
  for (const [code, description, shortDescription, unitPrice, category, isBillable, ndcRequired, revenueCode] of HCPCS) {
    const existing = await prisma.hcpcsCode.findFirst({
      where: { code, deletedAt: null },
    });
    const data = {
      code,
      description,
      shortDescription,
      category: category || deriveHcpcsCategory(code),
      unitPrice,
      isBillable,
      isActive: true,
      ndcRequired,
      revenueCode,
      coverageStatus: isBillable ? 'covered' : 'non_covered',
      unitType: category === 'J' ? 'unit' : 'each',
      placeOfService: '11',
      updatedBy: userId,
    };
    if (existing) {
      await prisma.hcpcsCode.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.hcpcsCode.create({
        data: { ...data, createdBy: userId },
      });
      created += 1;
    }
  }
  return { created, updated };
}

async function seedProcedures(userId, categoryMap, departmentId) {
  let created = 0;
  let updated = 0;
  for (const row of PROCEDURES) {
    const existing = await prisma.procedure.findFirst({
      where: { cptCode: row.cpt, deletedAt: null },
    });
    const split = splitProcedureCode(row.cpt);
    const data = {
      procedureDescription: row.desc,
      genericDescription: row.desc,
      cptCode: row.cpt,
      codeType: row.codeType || split.codeType,
      revenueCode: row.rev,
      unitPrice: row.price,
      cashPrice: Math.round(row.price * 0.8 * 100) / 100,
      cost: Math.round(row.price * 0.35 * 100) / 100,
      discountPercent: 20,
      placeOfService: row.pos,
      isBillable: true,
      isActive: true,
      isAddOn: !!row.addOn,
      globalPeriod: row.global,
      workRvu: row.rvu,
      chargeCode: `CDM-${row.cpt}`,
      defaultUnits: 1,
      departmentId,
      location: 'Main Campus',
      priceEffectiveDate: new Date('2026-01-01'),
      effectiveDate: new Date('2026-01-01'),
      updatedBy: userId,
    };

    let procedureId;
    if (existing) {
      await prisma.procedure.update({ where: { id: existing.id }, data });
      procedureId = existing.id;
      updated += 1;
    } else {
      const createdRow = await prisma.procedure.create({
        data: { ...data, createdBy: userId },
      });
      procedureId = createdRow.id;
      created += 1;
    }

    const category = categoryMap.get(row.cat);
    if (category) {
      await prisma.procedureCategoryOnProcedure.upsert({
        where: {
          procedureId_procedureCategoryId: {
            procedureId,
            procedureCategoryId: category.id,
          },
        },
        create: { procedureId, procedureCategoryId: category.id },
        update: {},
      });
    }
  }
  return { created, updated };
}

async function seedRcmCodes() {
  const userId = await resolveUserId();
  const department = await prisma.department.findFirst({
    where: { status: 'active' },
    orderBy: { createdAt: 'asc' },
  });

  const categoryMap = new Map();
  for (const name of CATEGORIES) {
    categoryMap.set(name, await upsertCategory(name, userId));
  }

  const diagnoses = await seedDiagnoses(userId);
  const hcpcs = await seedHcpcs(userId);
  const procedures = await seedProcedures(userId, categoryMap, department?.id || null);

  return { diagnoses, hcpcs, procedures, categories: CATEGORIES.length };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL. Set it in backend/.env');
    process.exit(1);
  }

  try {
    console.log('Seeding RCM code catalogs...\n');
    const result = await seedRcmCodes();
    console.log(`  Diagnosis codes   +${result.diagnoses.created} / ~${result.diagnoses.updated} updated`);
    console.log(`  HCPCS codes       +${result.hcpcs.created} / ~${result.hcpcs.updated} updated`);
    console.log(`  Procedures / CDM  +${result.procedures.created} / ~${result.procedures.updated} updated`);
    console.log(`  Categories        ${result.categories}`);
    console.log('\nDone.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedRcmCodes };
