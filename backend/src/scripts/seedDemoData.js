#!/usr/bin/env node
/**
 * Comprehensive demo seed for HMS (PostgreSQL + Prisma).
 *
 * Prerequisites: migrations applied (`npx prisma migrate deploy`) and client generated
 * (`npx prisma generate` from `backend/` — required; this project outputs the client under `src/generated/prisma`).
 *
 * Usage:
 *   node src/scripts/seedDemoData.js           # Seed only if DB is empty (typically right after migrate)
 *   node src/scripts/seedDemoData.js --wipe    # Delete ALL rows (FK-safe order), then seed
 *
 * npm scripts:
 *   npm run seed:demo
 *   npm run seed:demo:wipe
 *
 * Demo login after seed:
 *   Email:    root@localhost
 *   Password: 1234
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
/** Custom Prisma output (schema generator `output`): not resolvable via `@prisma/client` */
const { Prisma } = require('../generated/prisma');
const prisma = require('../lib/prisma');

const DEMO_ADMIN = {
  email: 'root@localhost',
  password: '1234',
  name: 'Admin User',
};

function parseArgs() {
  return {
    wipe: process.argv.includes('--wipe') || process.argv.includes('-w'),
  };
}

async function isDatabaseEmpty() {
  return (await prisma.user.count()) === 0;
}

async function wipeDatabase() {
  console.log('Removing existing data (respecting FKs)...\n');

  await prisma.$transaction(async (tx) => {
    await tx.order.deleteMany({});
    await tx.appointment.deleteMany({});
    await tx.rolePermission.deleteMany({});
    await tx.role.deleteMany({});
    await tx.permission.deleteMany({});
    await tx.subSpecialty.deleteMany({});
    await tx.specialty.deleteMany({});
    await tx.department.deleteMany({});
    await tx.location.deleteMany({});
    await tx.tenant.deleteMany({});
    await tx.patient.deleteMany({});
    await tx.insuranceProvider.deleteMany({});
    await tx.provider.deleteMany({});
    await tx.user.deleteMany({});
  });

  console.log('Wipe complete.\n');
}

async function seedPermissions() {
  const rows = [
    { name: 'patient.read', resource: 'patient', action: 'read', description: 'View patients' },
    { name: 'patient.create', resource: 'patient', action: 'create', description: 'Create patients' },
    { name: 'patient.update', resource: 'patient', action: 'update', description: 'Update patients' },
    { name: 'patient.delete', resource: 'patient', action: 'delete', description: 'Delete patients' },
    { name: 'appointment.read', resource: 'appointment', action: 'read', description: 'View appointments' },
    { name: 'appointment.create', resource: 'appointment', action: 'create', description: 'Create appointments' },
    { name: 'tenant.read', resource: 'tenant', action: 'read', description: 'View tenants / org' },
    { name: 'role.read', resource: 'role', action: 'read', description: 'View roles' },
  ];

  for (const p of rows) {
    await prisma.permission.upsert({
      where: { name: p.name },
      create: p,
      update: {},
    });
  }

  return prisma.permission.findMany();
}

async function runSeed() {
  console.log('Seeding demo data...\n');

  const hash = await bcrypt.hash(DEMO_ADMIN.password, 10);

  const admin = await prisma.user.create({
    data: {
      email: DEMO_ADMIN.email,
      password: hash,
      name: DEMO_ADMIN.name,
      role: 'admin',
      isActive: true,
    },
  });

  const seedUserId = admin.id;

  const permissions = await seedPermissions();

  const adminRole = await prisma.role.create({
    data: {
      name: 'Seed Administrator',
      description: 'Full demo access (RBAC sample)',
      isActive: true,
      createdBy: seedUserId,
      updatedBy: seedUserId,
    },
  });

  await prisma.rolePermission.createMany({
    data: permissions.map((perm) => ({
      roleId: adminRole.id,
      permissionId: perm.id,
    })),
    skipDuplicates: true,
  });

  const bcbs = await prisma.insuranceProvider.create({
    data: {
      name: 'Blue Cross Seed Regional',
      code: 'BCBS-SEED',
      phone: '555-3100',
      city: 'Boston',
      state: 'MA',
      zip: '02101',
      isActive: true,
    },
  });

  await prisma.insuranceProvider.create({
    data: {
      name: 'Aetna Seed Health',
      code: 'AETNA-SEED',
      phone: '555-3101',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      isActive: true,
    },
  });

  const patients = [];
  patients.push(
    await prisma.patient.create({
      data: {
        firstName: 'Alex',
        lastName: 'Rivera',
        dateOfBirth: new Date('1988-03-15'),
        gender: 'Female',
        contactNumber: '555-6200',
        email: 'alex.rivera@example.test',
        city: 'Cambridge',
        state: 'MA',
        preferredContactMethod: 'cell',
        insuranceProviderId: bcbs.id,
        policyNumber: 'POL-77821',
        copay: new Prisma.Decimal('25.00'),
      },
    })
  );
  patients.push(
    await prisma.patient.create({
      data: {
        firstName: 'Jordan',
        lastName: 'Lee',
        dateOfBirth: new Date('2015-11-02'),
        gender: 'Male',
        contactNumber: '555-6201',
        city: 'Quincy',
        state: 'MA',
        preferredContactMethod: 'cell',
      },
    })
  );
  patients.push(
    await prisma.patient.create({
      data: {
        firstName: 'Sam',
        lastName: 'Nguyen',
        dateOfBirth: new Date('1972-07-08'),
        gender: 'Other',
        contactNumber: '555-6202',
        primaryCarePhysician: 'Dr. Morgan',
        preferredContactMethod: 'cell',
      },
    })
  );

  const cardiology = await prisma.specialty.create({
    data: { name: 'Cardiology Seed', code: 'CARD-DEMO', isActive: true },
  });
  const pediatrics = await prisma.specialty.create({
    data: { name: 'Pediatrics Seed', code: 'PED-DEMO', isActive: true },
  });
  const internalMedicine = await prisma.specialty.create({
    data: { name: 'Internal Medicine Seed', code: 'IM-DEMO', isActive: true },
  });

  await prisma.subSpecialty.createMany({
    data: [
      { specialtyId: cardiology.id, name: 'Interventional Cardiology', code: 'ICARD-DEMO', isActive: true },
      { specialtyId: cardiology.id, name: 'Heart Failure', code: 'HF-DEMO', isActive: true },
    ],
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Healthcare System',
      isActive: true,
      createdBy: seedUserId,
      updatedBy: seedUserId,
    },
  });

  const mainCampus = await prisma.location.create({
    data: {
      name: 'Main Campus',
      address: '100 Seed Way',
      city: 'Boston',
      state: 'MA',
      country: 'US',
      phone: '555-4000',
      tenantId: tenant.id,
      createdBy: seedUserId,
      updatedBy: seedUserId,
      hasOnsiteLab: true,
      hasOnsitePharmacy: true,
      hasOnsiteRadiology: true,
      isActive: true,
    },
  });

  await prisma.location.create({
    data: {
      name: 'North Satellite',
      city: 'Waltham',
      state: 'MA',
      tenantId: tenant.id,
      createdBy: seedUserId,
      updatedBy: seedUserId,
      isActive: true,
    },
  });

  const famDept = await prisma.department.create({
    data: {
      departmentName: 'Family Medicine Seed',
      departmentCode: 'FAM-DEMO-01',
      departmentType: 'General',
      status: 'active',
      description: 'Primary care clinic (demo)',
      supportsAppointments: true,
      supportsWalkIns: true,
      defaultAppointmentDuration: 20,
      startTime: '08:00',
      endTime: '17:00',
      acceptsInsurance: true,
      locationId: mainCampus.id,
    },
  });

  const cardDept = await prisma.department.create({
    data: {
      departmentName: 'Cardiology Outpatient Seed',
      departmentCode: 'CARD-DEMO-01',
      departmentType: 'Specialty',
      status: 'active',
      locationId: mainCampus.id,
    },
  });

  const cardioInterventionalSub = await prisma.subSpecialty.findFirst({
    where: { specialtyId: cardiology.id, code: 'ICARD-DEMO' },
    select: { id: true },
  });

  await prisma.provider.createMany({
    data: [
      {
        npi: '1003000126',
        firstName: 'John',
        lastName: 'Smith',
        initials: 'JS',
        gender: 'Male',
        specialtyId: cardiology.id,
        subSpecialtyId: cardioInterventionalSub?.id ?? null,
        departmentId: cardDept.id,
        email: 'jsmith@clinic.demo',
        mobileNumber: '555-7301',
        city: 'Boston',
        state: 'MA',
        isActive: true,
      },
      {
        npi: '1003000127',
        firstName: 'Sarah',
        lastName: 'Johnson',
        initials: 'SJ',
        gender: 'Female',
        specialtyId: pediatrics.id,
        departmentId: famDept.id,
        email: 'sjohnson@clinic.demo',
        mobileNumber: '555-7302',
        city: 'Boston',
        state: 'MA',
        isActive: true,
      },
      {
        npi: '1003000128',
        firstName: 'Michael',
        lastName: 'Brown',
        initials: 'MB',
        gender: 'Male',
        specialtyId: internalMedicine.id,
        departmentId: famDept.id,
        email: 'mbrown@clinic.demo',
        mobileNumber: '555-7303',
        city: 'Cambridge',
        state: 'MA',
        isActive: true,
      },
    ],
  });


  const apptDate = new Date();
  apptDate.setHours(0, 0, 0, 0);

  const apt1 = await prisma.appointment.create({
    data: {
      appointmentDate: apptDate,
      appointmentTime: '09:30',
      duration: 30,
      appointmentType: 'Follow-up',
      visitReason: 'Blood pressure review',
      department: 'Family Medicine Seed',
      provider: 'Dr. Smith',
      status: 'Scheduled',
      patientId: patients[0].id,
      notes: 'Demo appointment',
    },
  });

  await prisma.appointment.create({
    data: {
      appointmentDate: apptDate,
      appointmentTime: '11:00',
      duration: 45,
      appointmentType: 'New',
      visitReason: 'Well-child visit',
      status: 'Scheduled',
      patientId: patients[1].id,
    },
  });

  await prisma.order.createMany({
    data: [
      {
        patientId: patients[0].id,
        appointmentId: apt1.id,
        category: 'Laboratory',
        procedureCode: '80053',
        procedureName: 'Comprehensive metabolic panel',
        status: 'Scheduled',
        destination: 'onsite',
        orderedBy: 'Dr. Demo',
      },
      {
        patientId: patients[2].id,
        category: 'Radiology',
        procedureCode: '71045',
        procedureName: 'Chest X-Ray 2 views',
        status: 'Scheduled',
        destination: 'onsite',
        orderedBy: 'Dr. Demo',
      },
    ],
  });

  console.log('Done.');
  console.log('');
  console.log(`  Users              1 (${DEMO_ADMIN.email})`);
  console.log(`  Tenants / locations ${tenant.name} (+ 2 locations)`);
  console.log(`  Departments        2`);
  console.log(`  Insurance providers 2`);
  console.log(`  Patients           ${patients.length}`);
  console.log(`  Providers          3`);
  console.log(`  Specialties       3 (+ subspecialties)`);
  console.log(`  Appointments       2`);
  console.log(`  Orders             2`);
  console.log(`  Permissions       ${permissions.length}`);
  console.log(`  Roles              1 (linked to all permissions)`);
  console.log('');
  console.log('  Login:', DEMO_ADMIN.email, '/', DEMO_ADMIN.password);
  console.log('');
}

async function main() {
  const { wipe } = parseArgs();

  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL. Set it in backend/.env');
    process.exit(1);
  }

  try {
    if (wipe) {
      await wipeDatabase();
      await runSeed();
    } else {
      const empty = await isDatabaseEmpty();
      if (!empty) {
        console.error('Database already has users. Seed skipped.');
        console.error('Use: node src/scripts/seedDemoData.js --wipe');
        console.error('(Destructive — removes ALL application data rows.)');
        process.exit(1);
      }
      await runSeed();
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
