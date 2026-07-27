#!/usr/bin/env node
/**
 * Seed sample medicines for the Pharmacy / Medicines Master page.
 *
 * Usage:
 *   node src/scripts/seedMedicinesMaster.js
 *
 * npm script:
 *   npm run seed:medicines
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const prisma = require('../lib/prisma');

const MEDICINES = [
  {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    code: 'MED-AMOX500',
    ndc: '00093-3109-01',
    strength: '500',
    strengthUnit: 'mg',
    dosageForm: 'Capsule',
    route: ['Oral'],
    medicationClass: 'Antibiotic',
    manufacturer: 'Teva Pharmaceuticals',
    isControlledSubstance: false,
    prescriptionRequired: true,
    defaultFrequency: 'Three times daily',
    defaultDose: '500',
    defaultDoseUnit: 'mg',
    defaultDuration: 7,
    durationUnit: 'Days',
    defaultQuantity: 21,
    refillAllowed: false,
    maximumRefills: 0,
    description: 'Penicillin-class antibiotic used for bacterial infections.',
    instructions: 'Take with or without food. Complete the full course.',
  },
  {
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    brandName: 'Advil',
    code: 'MED-IBU200',
    ndc: '00573-0171-20',
    strength: '200',
    strengthUnit: 'mg',
    dosageForm: 'Tablet',
    route: ['Oral'],
    medicationClass: 'Analgesic',
    manufacturer: 'Pfizer',
    isControlledSubstance: false,
    prescriptionRequired: false,
    defaultFrequency: 'Every 6 hours',
    defaultDose: '200',
    defaultDoseUnit: 'mg',
    defaultDuration: 5,
    durationUnit: 'Days',
    defaultQuantity: 20,
    refillAllowed: true,
    maximumRefills: 2,
    description: 'NSAID for pain, fever, and inflammation.',
    instructions: 'Take with food. Do not exceed recommended daily dose.',
  },
  {
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    brandName: 'Prinivil',
    code: 'MED-LIS10',
    ndc: '68180-0512-01',
    strength: '10',
    strengthUnit: 'mg',
    dosageForm: 'Tablet',
    route: ['Oral'],
    medicationClass: 'Antihypertensive',
    manufacturer: 'Lupin Pharmaceuticals',
    isControlledSubstance: false,
    prescriptionRequired: true,
    defaultFrequency: 'Once daily',
    defaultDose: '10',
    defaultDoseUnit: 'mg',
    defaultDuration: 30,
    durationUnit: 'Days',
    defaultQuantity: 30,
    refillAllowed: true,
    maximumRefills: 5,
    description: 'ACE inhibitor used to treat high blood pressure and heart failure.',
    instructions: 'Take at the same time each day. Monitor blood pressure.',
  },
  {
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    brandName: 'Glucophage',
    code: 'MED-MET500',
    ndc: '00093-7214-01',
    strength: '500',
    strengthUnit: 'mg',
    dosageForm: 'Tablet',
    route: ['Oral'],
    medicationClass: 'Antidiabetic',
    manufacturer: 'Bristol-Myers Squibb',
    isControlledSubstance: false,
    prescriptionRequired: true,
    defaultFrequency: 'Twice daily',
    defaultDose: '500',
    defaultDoseUnit: 'mg',
    defaultDuration: 30,
    durationUnit: 'Days',
    defaultQuantity: 60,
    refillAllowed: true,
    maximumRefills: 5,
    description: 'Biguanide used for type 2 diabetes mellitus.',
    instructions: 'Take with meals to reduce GI side effects.',
  },
  {
    name: 'Albuterol',
    genericName: 'Albuterol Sulfate',
    brandName: 'Ventolin HFA',
    code: 'MED-ALB90',
    ndc: '00173-0682-20',
    strength: '90',
    strengthUnit: 'mcg',
    dosageForm: 'Inhaler',
    route: ['Inhalation'],
    medicationClass: 'Bronchodilator',
    manufacturer: 'GlaxoSmithKline',
    isControlledSubstance: false,
    prescriptionRequired: true,
    defaultFrequency: 'As needed',
    defaultDose: '90',
    defaultDoseUnit: 'mcg',
    defaultQuantity: 1,
    refillAllowed: true,
    maximumRefills: 3,
    description: 'Short-acting beta agonist for bronchospasm relief.',
    instructions: 'Shake well before use. Rinse mouth after inhalation if directed.',
  },
  {
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    brandName: 'Prilosec',
    code: 'MED-OME20',
    ndc: '59762-0186-01',
    strength: '20',
    strengthUnit: 'mg',
    dosageForm: 'Capsule',
    route: ['Oral'],
    medicationClass: 'Other',
    manufacturer: 'AstraZeneca',
    isControlledSubstance: false,
    prescriptionRequired: true,
    defaultFrequency: 'Once daily',
    defaultDose: '20',
    defaultDoseUnit: 'mg',
    defaultDuration: 14,
    durationUnit: 'Days',
    defaultQuantity: 14,
    refillAllowed: true,
    maximumRefills: 2,
    description: 'Proton pump inhibitor for GERD and acid-related disorders.',
    instructions: 'Take before meals. Swallow whole; do not crush.',
  },
  {
    name: 'Cetirizine',
    genericName: 'Cetirizine Hydrochloride',
    brandName: 'Zyrtec',
    code: 'MED-CET10',
    ndc: '50580-0726-01',
    strength: '10',
    strengthUnit: 'mg',
    dosageForm: 'Tablet',
    route: ['Oral'],
    medicationClass: 'Antihistamine',
    manufacturer: 'Johnson & Johnson',
    isControlledSubstance: false,
    prescriptionRequired: false,
    defaultFrequency: 'Once daily',
    defaultDose: '10',
    defaultDoseUnit: 'mg',
    defaultDuration: 14,
    durationUnit: 'Days',
    defaultQuantity: 14,
    refillAllowed: true,
    maximumRefills: 3,
    description: 'Second-generation antihistamine for allergic rhinitis and urticaria.',
    instructions: 'May cause drowsiness in some patients.',
  },
  {
    name: 'Hydrocodone/Acetaminophen',
    genericName: 'Hydrocodone Bitartrate / Acetaminophen',
    brandName: 'Norco',
    code: 'MED-HYD5',
    ndc: '00406-0123-01',
    strength: '5',
    strengthUnit: 'mg',
    dosageForm: 'Tablet',
    route: ['Oral'],
    medicationClass: 'Analgesic',
    manufacturer: 'Mallinckrodt',
    isControlledSubstance: true,
    controlledSubstanceSchedule: 'Schedule II',
    prescriptionRequired: true,
    defaultFrequency: 'Every 6 hours',
    defaultDose: '5',
    defaultDoseUnit: 'mg',
    defaultDuration: 3,
    durationUnit: 'Days',
    defaultQuantity: 12,
    refillAllowed: false,
    maximumRefills: 0,
    description: 'Opioid analgesic combination (hydrocodone 5 mg / acetaminophen 325 mg) for moderate to severe pain.',
    instructions: 'Controlled substance. Avoid alcohol. Risk of dependence.',
  },
  {
    name: 'Insulin Glargine',
    genericName: 'Insulin Glargine',
    brandName: 'Lantus',
    code: 'MED-INS100',
    ndc: '00088-2220-33',
    strength: '100',
    strengthUnit: 'units',
    dosageForm: 'Injection',
    route: ['Subcutaneous'],
    medicationClass: 'Antidiabetic',
    manufacturer: 'Sanofi',
    isControlledSubstance: false,
    prescriptionRequired: true,
    defaultFrequency: 'Once daily',
    defaultDose: '10',
    defaultDoseUnit: 'units',
    defaultDuration: 30,
    durationUnit: 'Days',
    defaultQuantity: 1,
    refillAllowed: true,
    maximumRefills: 5,
    description: 'Long-acting basal insulin for diabetes management.',
    instructions: 'Inject subcutaneously. Do not mix with other insulins unless directed.',
  },
  {
    name: 'Prednisone',
    genericName: 'Prednisone',
    brandName: 'Deltasone',
    code: 'MED-PRED20',
    ndc: '00591-5442-01',
    strength: '20',
    strengthUnit: 'mg',
    dosageForm: 'Tablet',
    route: ['Oral'],
    medicationClass: 'Corticosteroid',
    manufacturer: 'Watson Pharmaceuticals',
    isControlledSubstance: false,
    prescriptionRequired: true,
    defaultFrequency: 'Once daily',
    defaultDose: '20',
    defaultDoseUnit: 'mg',
    defaultDuration: 5,
    durationUnit: 'Days',
    defaultQuantity: 5,
    refillAllowed: false,
    maximumRefills: 0,
    description: 'Systemic corticosteroid for inflammatory and allergic conditions.',
    instructions: 'Take with food. Do not stop abruptly if used long-term.',
  },
];

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const med of MEDICINES) {
    const existing = await prisma.medicationCatalog.findFirst({
      where: {
        OR: [{ code: med.code }, { name: med.name, strength: med.strength, dosageForm: med.dosageForm }],
        deletedAt: null,
      },
    });

    const payload = {
      ...med,
      isActive: true,
      refillAllowed: med.refillAllowed !== false,
      prescriptionRequired: med.prescriptionRequired !== false,
      isControlledSubstance: !!med.isControlledSubstance,
      controlledSubstanceSchedule: med.controlledSubstanceSchedule || null,
      effectiveDate: today,
      expiryDate: null,
    };

    if (existing) {
      await prisma.medicationCatalog.update({
        where: { id: existing.id },
        data: {
          ...payload,
          deletedAt: null,
        },
      });
      updated += 1;
      console.log(`Updated: ${med.name} (${med.code})`);
    } else {
      await prisma.medicationCatalog.create({
        data: payload,
      });
      created += 1;
      console.log(`Created: ${med.name} (${med.code})`);
    }
  }

  const total = await prisma.medicationCatalog.count({ where: { deletedAt: null } });
  console.log(`\nDone. created=${created}, updated=${updated}, skipped=${skipped}, totalActive=${total}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
