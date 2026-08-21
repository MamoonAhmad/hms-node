#!/usr/bin/env node
/**
 * Seed realistic sample patients, appointments, and RCM encounter billing data.
 *
 * Safe to re-run: upserts by demo email / encounter notes tag. Does not wipe unrelated data.
 *
 * Prerequisites:
 *   - DATABASE_URL in backend/.env
 *   - Migrations applied
 *   - Admin user (npm run seed:admin)
 *   - RCM code catalogs recommended (npm run seed:rcm-codes)
 *
 * Usage:
 *   node src/scripts/seedSampleClinicalData.js
 *   node src/scripts/seedSampleClinicalData.js --refresh   # remove prior sample rows, then re-seed
 *
 * npm script:
 *   npm run seed:sample
 *   npm run seed:sample:refresh
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const crypto = require('crypto');
const { Prisma } = require('../generated/prisma');
const prisma = require('../lib/prisma');

const SEED_TAG = 'sample-clinical-v1';
const ADMIN_EMAIL = 'root@localhost';

function parseArgs() {
  return { refresh: process.argv.includes('--refresh') || process.argv.includes('-r') };
}

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = todayDate();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n) {
  const d = todayDate();
  d.setDate(d.getDate() + n);
  return d;
}

async function generateEncounterNumber() {
  const prefix = `ENC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const encounterNumber = `${prefix}-${suffix}`;
    const existing = await prisma.appointment.findUnique({ where: { encounterNumber } });
    if (!existing) return encounterNumber;
  }
  return `ENC-${Date.now()}`;
}

async function ensureAdminUser() {
  const user = await prisma.user.findFirst({ where: { email: ADMIN_EMAIL, isActive: true } });
  if (!user) {
    throw new Error(`Admin user not found (${ADMIN_EMAIL}). Run: npm run seed:admin`);
  }
  return user;
}

async function ensurePayer(tx, userId, { name, code, phone, city, state, zip }) {
  let row = await tx.insuranceProvider.findFirst({
    where: { code, deletedAt: null },
  });
  if (!row) {
    row = await tx.insuranceProvider.create({
      data: { name, code, phone, city, state, zip, isActive: true },
    });
  }
  return row;
}

async function ensureSpecialty(tx, { name, code }) {
  let row = await tx.specialty.findFirst({ where: { code } });
  if (!row) {
    row = await tx.specialty.create({ data: { name, code, isActive: true } });
  }
  return row;
}

async function ensureTenantAndLocation(tx, userId) {
  let tenant = await tx.tenant.findFirst({ where: { name: 'HMS Sample Health System' } });
  if (!tenant) {
    tenant = await tx.tenant.create({
      data: {
        name: 'HMS Sample Health System',
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  let location = await tx.location.findFirst({
    where: { name: 'Main Medical Center', tenantId: tenant.id },
  });
  if (!location) {
    location = await tx.location.create({
      data: {
        name: 'Main Medical Center',
        address: '1200 Healthcare Blvd',
        city: 'Chicago',
        state: 'IL',
        country: 'US',
        phone: '312-555-0100',
        tenantId: tenant.id,
        hasOnsiteLab: true,
        hasOnsiteRadiology: true,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  return { tenant, location };
}

async function ensureDepartment(tx, userId, locationId, { departmentName, departmentCode }) {
  let row = await tx.department.findFirst({ where: { departmentCode } });
  if (!row) {
    row = await tx.department.create({
      data: {
        departmentName,
        departmentCode,
        departmentType: 'General',
        status: 'active',
        supportsAppointments: true,
        defaultAppointmentDuration: 30,
        startTime: '08:00',
        endTime: '17:00',
        acceptsInsurance: true,
        locationId,
      },
    });
  }
  return row;
}

async function ensureProvider(tx, specialtyId, departmentId, spec) {
  let row = await tx.provider.findUnique({ where: { npi: spec.npi } });
  if (!row) {
    row = await tx.provider.create({
      data: {
        npi: spec.npi,
        firstName: spec.firstName,
        middleName: spec.middleName || null,
        lastName: spec.lastName,
        initials: spec.initials,
        gender: spec.gender,
        specialtyId,
        departmentId,
        email: spec.email,
        mobileNumber: spec.phone,
        city: spec.city || 'Chicago',
        state: spec.state || 'IL',
        isActive: true,
      },
    });
  }
  return row;
}

async function ensureAppointmentType(tx, userId, name) {
  let row = await tx.appointmentType.findFirst({
    where: { name, deletedAt: null, isActive: true },
  });
  if (!row) {
    row = await tx.appointmentType.create({
      data: {
        name,
        description: `${name} visit (sample seed)`,
        defaultTime: 30,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }
  return row;
}

async function ensureAppointmentStatus(tx, userId, name, color = '#3b82f6') {
  let row = await tx.appointmentStatus.findFirst({
    where: { name, deletedAt: null, isActive: true },
  });
  if (!row) {
    row = await tx.appointmentStatus.create({
      data: {
        name,
        color,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }
  return row;
}

async function lookupDiagnosis(code) {
  return prisma.diagnosisCode.findFirst({
    where: { code, deletedAt: null },
    select: { id: true, code: true, description: true },
  });
}

async function upsertPatient(tx, userId, spec, payerIds) {
  const existing = await tx.patient.findFirst({
    where: { email: spec.email, deletedAt: null },
    include: { insurances: true },
  });

  const patientData = {
    firstName: spec.firstName,
    middleName: spec.middleName || null,
    lastName: spec.lastName,
    suffix: spec.suffix || null,
    dateOfBirth: new Date(spec.dateOfBirth),
    gender: spec.gender.charAt(0).toUpperCase() + spec.gender.slice(1).toLowerCase(),
    genderIdentity: spec.genderIdentity || spec.gender,
    contactNumber: spec.cellPhone,
    cellPhone: spec.cellPhone,
    homePhone: spec.homePhone || null,
    email: spec.email,
    address: spec.address,
    addressLine2: spec.addressLine2 || null,
    city: spec.city,
    state: spec.state,
    zip: spec.zip,
    country: 'US',
    maritalStatus: spec.maritalStatus || null,
    employmentStatus: spec.employmentStatus || null,
    employerName: spec.employerName || null,
    ethnicity: spec.ethnicity || null,
    race: spec.race || null,
    language: spec.language || 'English',
    billingType: spec.billingType || 'Insurance',
    registrationStatus: 'completed',
    registrationChannel: 'seed',
    chartStatus: 'active',
    consentFormSigned: true,
    emergencyContactName: spec.emergencyContactName || null,
    emergencyContactNumber: spec.emergencyContactNumber || null,
    emergencyContactRelationship: spec.emergencyContactRelationship || null,
    guarantorName: spec.guarantorName || `${spec.lastName}, ${spec.firstName}`,
    guarantorRelationship: spec.guarantorRelationship || 'Self',
    guarantorPhone: spec.cellPhone,
    patientIsMinor: !!spec.patientIsMinor,
    insuranceProviderId: payerIds[spec.primaryPayerKey] || null,
    policyNumber: spec.insurances?.[0]?.memberId || null,
    copay: spec.insurances?.[0]?.copay != null
      ? new Prisma.Decimal(String(spec.insurances[0].copay))
      : null,
    generalNotes: `[${SEED_TAG}] Sample patient for demos.`,
    updatedBy: userId,
  };

  let patient;
  if (existing) {
    patient = await tx.patient.update({
      where: { id: existing.id },
      data: patientData,
    });
    await tx.patientInsurance.deleteMany({ where: { patientId: patient.id } });
    await tx.patientProblem.deleteMany({ where: { patientId: patient.id, description: { contains: SEED_TAG } } });
    await tx.patientAllergy.deleteMany({ where: { patientId: patient.id, allergenName: { in: spec.allergies?.map((a) => a.allergenName) || [] } } });
  } else {
    patient = await tx.patient.create({
      data: {
        ...patientData,
        createdBy: userId,
      },
    });
  }

  if (Array.isArray(spec.insurances)) {
    for (const ins of spec.insurances) {
      const providerId = payerIds[ins.payerKey];
      if (!providerId || !ins.memberId) continue;
      await tx.patientInsurance.create({
        data: {
          patientId: patient.id,
          insuranceType: ins.tier,
          insuranceProviderId: providerId,
          memberId: ins.memberId,
          groupNumber: ins.groupNumber || null,
          planName: ins.planName || null,
          policyType: ins.policyType || 'group policy',
          subscriberFirstName: ins.subscriberFirstName || spec.firstName,
          subscriberLastName: ins.subscriberLastName || spec.lastName,
          subscriberRelationship: ins.subscriberRelationship || 'Self',
          subscriberDateOfBirth: ins.subscriberDob ? new Date(ins.subscriberDob) : new Date(spec.dateOfBirth),
          coverageStartDate: ins.effectiveDate ? new Date(ins.effectiveDate) : new Date('2024-01-01'),
          copay: ins.copay != null ? new Prisma.Decimal(String(ins.copay)) : null,
          deductible: ins.deductible != null ? new Prisma.Decimal(String(ins.deductible)) : null,
          authorizationNumber: ins.authorizationNumber || null,
          isActive: true,
        },
      });
    }
  }

  if (Array.isArray(spec.problems)) {
    for (const problem of spec.problems) {
      const dx = problem.code ? await lookupDiagnosis(problem.code) : null;
      await tx.patientProblem.create({
        data: {
          patientId: patient.id,
          diagnosisId: dx?.id || null,
          problemCode: problem.code || null,
          description: problem.description || dx?.description || problem.code,
          status: 'Active',
          onsetDate: problem.onsetDate ? new Date(problem.onsetDate) : null,
          notes: `[${SEED_TAG}]`,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }
  }

  if (Array.isArray(spec.allergies)) {
    for (const allergy of spec.allergies) {
      await tx.patientAllergy.create({
        data: {
          patientId: patient.id,
          allergenName: allergy.allergenName,
          reaction: allergy.reaction || null,
          severity: allergy.severity || 'Moderate',
          status: 'Active',
        },
      });
    }
  }

  const insurances = await tx.patientInsurance.findMany({
    where: { patientId: patient.id },
    orderBy: { insuranceType: 'asc' },
  });

  return { patient, insurances };
}

async function upsertAppointment(tx, userId, spec, refs) {
  const notesTag = `[${SEED_TAG}] ${spec.seedKey}`;
  const existing = await tx.appointment.findFirst({
    where: { patientId: spec.patientId, notes: { contains: notesTag } },
  });

  const providerName = [refs.provider.firstName, refs.provider.middleName, refs.provider.lastName]
    .filter(Boolean)
    .join(' ');

  const primaryIns = spec.insurances?.find((i) => i.tier === 'primary');
  const secondaryIns = spec.insurances?.find((i) => i.tier === 'secondary');

  const payload = {
    appointmentDate: spec.appointmentDate,
    appointmentTime: spec.appointmentTime,
    appointmentEndTime: spec.appointmentEndTime || null,
    duration: spec.duration || 30,
    appointmentTypeId: refs.appointmentTypeId,
    visitReason: spec.visitReason,
    chiefComplaint: spec.chiefComplaint || spec.visitReason,
    department: refs.department.departmentName,
    departmentId: refs.department.id,
    provider: providerName,
    providerId: refs.provider.id,
    status: spec.status,
    notes: notesTag,
    locationId: refs.location.id,
    placeOfService: spec.placeOfService || '11 - Office',
    primaryInsuranceId: primaryIns?.id || null,
    secondaryInsuranceId: secondaryIns?.id || null,
    rcmStatus: spec.rcmStatus || 'Eligibility Pending',
    checkedInAt: spec.checkedInAt || null,
    checkoutAt: spec.checkoutAt || null,
    updatedBy: userId,
  };

  if (existing) {
    return tx.appointment.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return tx.appointment.create({
    data: {
      encounterNumber: await generateEncounterNumber(),
      patientId: spec.patientId,
      ...payload,
      createdBy: userId,
    },
  });
}

async function upsertEncounterBilling(tx, userId, appointment, overlay) {
  const existing = await tx.encounterBilling.findUnique({
    where: { appointmentId: appointment.id },
  });

  const data = {
    patientId: appointment.patientId,
    billingStatus: overlay.billingStatus,
    diagnoses: overlay.diagnoses,
    charges: overlay.charges,
    payments: overlay.payments || [],
    followUpNotes: overlay.followUpNotes || [],
    auditTrail: overlay.auditTrail || [],
    meta: overlay.meta || {},
    updatedBy: userId,
  };

  if (existing) {
    return tx.encounterBilling.update({
      where: { appointmentId: appointment.id },
      data,
    });
  }

  return tx.encounterBilling.create({
    data: {
      appointmentId: appointment.id,
      ...data,
      createdBy: userId,
    },
  });
}

async function removePriorSampleRows() {
  const taggedAppointments = await prisma.appointment.findMany({
    where: { notes: { contains: SEED_TAG } },
    select: { id: true, patientId: true },
  });

  const appointmentIds = taggedAppointments.map((a) => a.id);

  if (appointmentIds.length) {
    await prisma.encounterBilling.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    await prisma.appointmentHistory.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    await prisma.appointment.deleteMany({ where: { id: { in: appointmentIds } } });
  }

  const samplePatients = await prisma.patient.findMany({
    where: { generalNotes: { contains: SEED_TAG }, deletedAt: null },
    select: { id: true },
  });

  for (const { id } of samplePatients) {
    await prisma.patientInsurance.deleteMany({ where: { patientId: id } });
    await prisma.patientProblem.deleteMany({ where: { patientId: id } });
    await prisma.patientAllergy.deleteMany({ where: { patientId: id } });
    await prisma.patient.delete({ where: { id } });
  }
}

const SAMPLE_PATIENTS = [
  {
    seedKey: 'ricky-ponting',
    firstName: 'Ricky',
    middleName: 'M',
    lastName: 'Ponting',
    dateOfBirth: '1985-04-12',
    gender: 'male',
    cellPhone: '312-555-0142',
    homePhone: '312-555-0143',
    email: 'ricky.ponting@sample.hms.local',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zip: '62704',
    maritalStatus: 'Married',
    employmentStatus: 'Employed',
    employerName: 'State Farm Insurance',
    ethnicity: 'Not Hispanic or Latino',
    race: 'White',
    billingType: 'Insurance',
    primaryPayerKey: 'bcbs',
    insurances: [
      {
        tier: 'primary',
        payerKey: 'bcbs',
        memberId: 'BCBS-8842190',
        groupNumber: 'GRP-10234',
        planName: 'Blue PPO Gold',
        policyType: 'group policy',
        copay: 25,
        deductible: 1500,
        authorizationNumber: 'AUTH-2026-44102',
        effectiveDate: '2024-01-01',
      },
      {
        tier: 'secondary',
        payerKey: 'aetna',
        memberId: 'AET-9928173',
        groupNumber: 'SEC-5501',
        planName: 'Aetna Supplement',
        policyType: 'supplimental policy',
        copay: 0,
        subscriberRelationship: 'Self',
        effectiveDate: '2024-01-01',
      },
    ],
    problems: [
      { code: 'I10', description: 'Essential (primary) hypertension', onsetDate: '2020-06-01' },
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', onsetDate: '2021-03-15' },
    ],
    allergies: [
      { allergenName: 'Penicillin', reaction: 'Rash', severity: 'Moderate' },
    ],
    appointment: {
      seedKey: 'ricky-followup-today',
      appointmentDate: todayDate(),
      appointmentTime: '09:30',
      appointmentEndTime: '10:00',
      duration: 30,
      status: 'Completed',
      visitReason: 'Follow-up for blood pressure and diabetes management',
      chiefComplaint: 'Elevated blood pressure readings at home',
      placeOfService: '11 - Office',
      rcmStatus: 'Coding Complete',
      checkedInAt: new Date(),
      checkoutAt: new Date(),
      billingStatus: 'Coding',
      diagnoses: [
        { code: 'I10', pointer: 'A', isPrimary: true },
        { code: 'E11.9', pointer: 'B', isPrimary: false },
        { code: 'E78.5', pointer: 'C', isPrimary: false },
      ],
      charges: [
        { cptCode: '99214', description: 'Office visit, established patient, moderate MDM', units: 1, unitCharge: 215, modifiers: '', diagnosisPointers: 'A,B', placeOfService: '11' },
        { cptCode: '83036', description: 'Hemoglobin A1c', units: 1, unitCharge: 38, modifiers: '', diagnosisPointers: 'B', placeOfService: '11' },
        { cptCode: '80053', description: 'Comprehensive metabolic panel', units: 1, unitCharge: 45, modifiers: '', diagnosisPointers: 'A,B', placeOfService: '11' },
      ],
    },
  },
  {
    seedKey: 'maria-gonzalez',
    firstName: 'Maria',
    lastName: 'Gonzalez',
    dateOfBirth: '1968-09-22',
    gender: 'female',
    cellPhone: '773-555-0198',
    email: 'maria.gonzalez@sample.hms.local',
    address: '455 Oak Park Ave',
    city: 'Oak Park',
    state: 'IL',
    zip: '60302',
    maritalStatus: 'Widowed',
    employmentStatus: 'Retired',
    ethnicity: 'Hispanic or Latino',
    race: 'Other',
    billingType: 'Insurance',
    primaryPayerKey: 'medicare',
    insurances: [
      {
        tier: 'primary',
        payerKey: 'medicare',
        memberId: '1EG4-TE5-MK72',
        planName: 'Medicare Part B',
        policyType: 'medicare primary',
        copay: 0,
        authorizationNumber: 'MCR-AUTH-7781',
        effectiveDate: '2023-01-01',
      },
      {
        tier: 'secondary',
        payerKey: 'bcbs',
        memberId: 'BCBS-MED-33102',
        groupNumber: 'MED-SUP-88',
        planName: 'Medicare Supplement Plan G',
        policyType: 'supplimental policy',
        copay: 0,
        effectiveDate: '2023-01-01',
      },
    ],
    problems: [
      { code: 'I48.91', description: 'Unspecified atrial fibrillation', onsetDate: '2019-11-10' },
      { code: 'I50.9', description: 'Heart failure, unspecified', onsetDate: '2022-02-01' },
    ],
    allergies: [
      { allergenName: 'Sulfa drugs', reaction: 'Hives', severity: 'Severe' },
    ],
    appointment: {
      seedKey: 'maria-cardio-checkout',
      appointmentDate: todayDate(),
      appointmentTime: '11:15',
      duration: 45,
      status: 'Check out',
      visitReason: 'Cardiology follow-up — anticoagulation review',
      chiefComplaint: 'Palpitations and shortness of breath',
      placeOfService: '11 - Office',
      rcmStatus: 'Ready for Coding',
      checkedInAt: new Date(),
      billingStatus: 'Coding',
      diagnoses: [
        { code: 'I48.91', pointer: 'A', isPrimary: true },
        { code: 'I50.9', pointer: 'B', isPrimary: false },
      ],
      charges: [
        { cptCode: '99215', description: 'Office visit, established patient, high MDM', units: 1, unitCharge: 285, diagnosisPointers: 'A,B', placeOfService: '11' },
        { cptCode: '93000', description: 'Electrocardiogram, complete', units: 1, unitCharge: 55, diagnosisPointers: 'A', placeOfService: '11' },
      ],
    },
  },
  {
    seedKey: 'james-thompson',
    firstName: 'James',
    lastName: 'Thompson',
    dateOfBirth: '1992-01-30',
    gender: 'male',
    cellPhone: '847-555-0177',
    email: 'james.thompson@sample.hms.local',
    address: '88 Lake Shore Dr',
    addressLine2: 'Apt 12B',
    city: 'Chicago',
    state: 'IL',
    zip: '60611',
    maritalStatus: 'Single',
    employmentStatus: 'Employed',
    employerName: 'Midwest Software LLC',
    billingType: 'Insurance',
    primaryPayerKey: 'uhc',
    insurances: [
      {
        tier: 'primary',
        payerKey: 'uhc',
        memberId: 'UHC-773829104',
        groupNumber: 'MW-44821',
        planName: 'United Choice Plus',
        policyType: 'group policy',
        copay: 30,
        deductible: 2000,
        effectiveDate: '2025-01-01',
      },
    ],
    problems: [
      { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', onsetDate: '2026-08-17' },
    ],
    allergies: [],
    appointment: {
      seedKey: 'james-uri-scheduled',
      appointmentDate: daysFromNow(2),
      appointmentTime: '14:00',
      duration: 20,
      status: 'Scheduled',
      visitReason: 'Acute cough and congestion',
      chiefComplaint: 'Cough for 5 days with mild fever',
      placeOfService: '11 - Office',
      rcmStatus: 'Eligibility Pending',
      billingStatus: 'Unbilled',
      diagnoses: [],
      charges: [],
    },
  },
  {
    seedKey: 'emily-chen',
    firstName: 'Emily',
    lastName: 'Chen',
    dateOfBirth: '2018-07-14',
    gender: 'female',
    cellPhone: '630-555-0165',
    email: 'emily.chen.guardian@sample.hms.local',
    address: '210 Maple Street',
    city: 'Naperville',
    state: 'IL',
    zip: '60540',
    patientIsMinor: true,
    guarantorName: 'Chen, Wei',
    guarantorRelationship: 'Parent',
    billingType: 'Insurance',
    primaryPayerKey: 'bcbs',
    insurances: [
      {
        tier: 'primary',
        payerKey: 'bcbs',
        memberId: 'BCBS-PED-220981',
        groupNumber: 'PED-7782',
        planName: 'Blue Pediatric PPO',
        policyType: 'group policy',
        copay: 20,
        subscriberFirstName: 'Wei',
        subscriberLastName: 'Chen',
        subscriberRelationship: 'Child',
        effectiveDate: '2024-01-01',
      },
    ],
    problems: [
      { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', onsetDate: '2023-04-01' },
    ],
    allergies: [
      { allergenName: 'Peanuts', reaction: 'Anaphylaxis', severity: 'Severe' },
    ],
    appointment: {
      seedKey: 'emily-well-child',
      appointmentDate: daysAgo(1),
      appointmentTime: '10:30',
      duration: 30,
      status: 'Completed',
      visitReason: 'Well-child visit — asthma follow-up',
      chiefComplaint: 'Routine asthma check',
      placeOfService: '11 - Office',
      rcmStatus: 'Coding Complete',
      checkedInAt: daysAgo(1),
      checkoutAt: daysAgo(1),
      billingStatus: 'Coding',
      diagnoses: [
        { code: 'J45.909', pointer: 'A', isPrimary: true },
        { code: 'Z00.129', pointer: 'B', isPrimary: false },
      ],
      charges: [
        { cptCode: '99213', description: 'Office visit, established patient, low MDM', units: 1, unitCharge: 185, diagnosisPointers: 'A,B', placeOfService: '11' },
        { cptCode: '94640', description: 'Pressurized/nonpressurized inhalation treatment', units: 1, unitCharge: 48, diagnosisPointers: 'A', placeOfService: '11' },
      ],
    },
  },
];

async function buildDiagnoses(entries) {
  const rows = [];
  for (const entry of entries) {
    const dx = entry.code ? await lookupDiagnosis(entry.code) : null;
    rows.push({
      id: crypto.randomUUID(),
      code: entry.code,
      description: dx?.description || entry.description || entry.code,
      pointer: entry.pointer,
      isPrimary: !!entry.isPrimary,
      catalogId: dx?.id || null,
    });
  }
  return rows;
}

function buildCharges(entries) {
  return entries.map((line) => ({
    id: crypto.randomUUID(),
    cptCode: line.cptCode,
    hcpcsCode: line.hcpcsCode || null,
    description: line.description,
    modifiers: line.modifiers || '',
    units: Number(line.units) || 1,
    unitCharge: Number(line.unitCharge) || 0,
    diagnosisPointers: line.diagnosisPointers || 'A',
    placeOfService: line.placeOfService || '11',
    revenueCode: line.revenueCode || null,
  }));
}

async function runSeed() {
  const admin = await ensureAdminUser();

  if (parseArgs().refresh) {
    console.log('Removing prior sample-clinical rows...\n');
    await removePriorSampleRows();
  }

  const results = await prisma.$transaction(async (tx) => {
    const payers = {
      bcbs: await ensurePayer(tx, admin.id, {
        name: 'Blue Cross Blue Shield of Illinois',
        code: 'SAMPLE-BCBS-IL',
        phone: '800-555-0101',
        city: 'Chicago',
        state: 'IL',
        zip: '60606',
      }),
      aetna: await ensurePayer(tx, admin.id, {
        name: 'Aetna Better Health',
        code: 'SAMPLE-AETNA',
        phone: '800-555-0102',
        city: 'Hartford',
        state: 'CT',
        zip: '06156',
      }),
      medicare: await ensurePayer(tx, admin.id, {
        name: 'Medicare',
        code: 'SAMPLE-MEDICARE',
        phone: '800-633-4227',
        city: 'Baltimore',
        state: 'MD',
        zip: '21244',
      }),
      uhc: await ensurePayer(tx, admin.id, {
        name: 'UnitedHealthcare',
        code: 'SAMPLE-UHC',
        phone: '800-555-0104',
        city: 'Minnetonka',
        state: 'MN',
        zip: '55343',
      }),
    };

    const imSpecialty = await ensureSpecialty(tx, { name: 'Internal Medicine', code: 'SAMPLE-IM' });
    const { location } = await ensureTenantAndLocation(tx, admin.id);
    const famDept = await ensureDepartment(tx, admin.id, location.id, {
      departmentName: 'Family Medicine',
      departmentCode: 'SAMPLE-FAM-01',
    });
    const cardioDept = await ensureDepartment(tx, admin.id, location.id, {
      departmentName: 'Cardiology',
      departmentCode: 'SAMPLE-CARD-01',
    });

    const michaelJames = await ensureProvider(tx, imSpecialty.id, famDept.id, {
      npi: '1629384756',
      firstName: 'Michael',
      lastName: 'James',
      initials: 'MJ',
      gender: 'Male',
      email: 'mjames@sample.hms.local',
      phone: '312-555-7301',
    });

    const sarahPatel = await ensureProvider(tx, imSpecialty.id, cardioDept.id, {
      npi: '1748293650',
      firstName: 'Sarah',
      lastName: 'Patel',
      initials: 'SP',
      gender: 'Female',
      email: 'spatel@sample.hms.local',
      phone: '312-555-7302',
    });

    const apptTypeFollowUp = await ensureAppointmentType(tx, admin.id, 'Follow-up');
    const apptTypeNew = await ensureAppointmentType(tx, admin.id, 'New Patient');
    const apptTypeWellChild = await ensureAppointmentType(tx, admin.id, 'Well Child');

    for (const statusName of ['Scheduled', 'Completed', 'Check out', 'Checked-In']) {
      await ensureAppointmentStatus(tx, admin.id, statusName);
    }

    const seeded = [];

    for (const spec of SAMPLE_PATIENTS) {
      const { patient, insurances } = await upsertPatient(tx, admin.id, spec, {
        bcbs: payers.bcbs.id,
        aetna: payers.aetna.id,
        medicare: payers.medicare.id,
        uhc: payers.uhc.id,
      });

      const apptSpec = spec.appointment;
      const provider = spec.seedKey === 'maria-gonzalez' ? sarahPatel : michaelJames;
      const department = spec.seedKey === 'maria-gonzalez' ? cardioDept : famDept;
      const appointmentTypeId = apptSpec.seedKey.includes('well-child')
        ? apptTypeWellChild.id
        : apptSpec.status === 'Scheduled'
          ? apptTypeNew.id
          : apptTypeFollowUp.id;

      const tierMap = Object.fromEntries(insurances.map((ins) => [ins.insuranceType, ins]));

      const appointment = await upsertAppointment(
        tx,
        admin.id,
        {
          ...apptSpec,
          patientId: patient.id,
          insurances: [
            tierMap.primary ? { ...tierMap.primary, tier: 'primary' } : null,
            tierMap.secondary ? { ...tierMap.secondary, tier: 'secondary' } : null,
          ].filter(Boolean),
        },
        {
          provider,
          department,
          location,
          appointmentTypeId,
        },
      );

      if (apptSpec.diagnoses?.length || apptSpec.charges?.length || apptSpec.billingStatus) {
        const diagnoses = await buildDiagnoses(apptSpec.diagnoses || []);
        const charges = buildCharges(apptSpec.charges || []);
        const primaryIns = insurances.find((i) => i.insuranceType === 'primary');

        await upsertEncounterBilling(tx, admin.id, appointment, {
          billingStatus: apptSpec.billingStatus || 'Unbilled',
          diagnoses,
          charges,
          payments: [],
          followUpNotes: [],
          auditTrail: [
            {
              id: crypto.randomUUID(),
              action: 'Encounter seeded for billing demo',
              userName: admin.name || 'Seed Script',
              createdAt: new Date().toISOString(),
              details: SEED_TAG,
            },
          ],
          meta: {
            payerName: primaryIns
              ? payers[spec.primaryPayerKey]?.name || 'Unknown payer'
              : 'Self-Pay',
            placeOfService: apptSpec.placeOfService || '11 - Office',
            seedTag: SEED_TAG,
          },
        });
      }

      seeded.push({
        patient: `${patient.lastName}, ${patient.firstName}`,
        mrn: patient.mrn,
        email: patient.email,
        encounter: appointment.encounterNumber,
        status: appointment.status,
        encounterUrl: `/rcm/encounters/${appointment.id}`,
      });
    }

    return seeded;
  }, { timeout: 120000 });

  console.log('Sample clinical data seeded successfully.\n');
  console.log('Patients, appointments, and encounter billing:\n');
  results.forEach((row) => {
    console.log(`  ${row.patient} (MRN ${row.mrn})`);
    console.log(`    Email:     ${row.email}`);
    console.log(`    Encounter: ${row.encounter} — ${row.status}`);
    console.log(`    RCM page:  http://localhost:5173${row.encounterUrl}`);
    console.log('');
  });
  console.log('UI entry points:');
  console.log('  Patients:     http://localhost:5173/patients');
  console.log('  Appointments: http://localhost:5173/appointments');
  console.log('  RCM Worklist: http://localhost:5173/rcm/worklist');
  console.log('');
  console.log('Re-run with --refresh to replace sample rows.');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL. Set it in backend/.env');
    process.exit(1);
  }

  try {
    await runSeed();
  } catch (err) {
    console.error('Seed failed:', err.message || err);
    if (err.meta) console.error(err.meta);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
