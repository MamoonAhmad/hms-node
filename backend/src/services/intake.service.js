const prisma = require('../lib/prisma');
const {
  ENCOUNTER_VISIT_STATUS,
  shouldAdvanceStatus,
} = require('../utils/encounterVisitStatus');

const NOT_DELETED = { isDeleted: false };

async function advanceEncounterStatus(appointmentId, nextStatus) {
  if (!appointmentId || !nextStatus) return;
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, status: true },
  });
  if (!appointment) return;
  if (!shouldAdvanceStatus(appointment.status, nextStatus)) return;
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: nextStatus },
  });
}

async function assertPatientExists(patientId) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
    select: { id: true },
  });
  if (!patient) {
    const err = new Error('Patient not found');
    err.statusCode = 404;
    throw err;
  }
}

function formatUserName(user) {
  if (!user) return null;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : user.email || null;
}

async function getIntakeBundle(patientId, { encounterId, sectionType } = {}) {
  await assertPatientExists(patientId);

  const recordWhere = {
    patientId,
    ...NOT_DELETED,
    isAddendum: false,
    ...(encounterId ? { appointmentId: encounterId } : {}),
    ...(sectionType ? { sectionType } : {}),
  };

  const [records, status, allergies, patient] = await Promise.all([
    prisma.patientIntakeRecord.findMany({
      where: recordWhere,
      include: {
        addendums: {
          where: NOT_DELETED,
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.patientIntakeStatus.findFirst({
      where: {
        patientId,
        ...(encounterId ? { appointmentId: encounterId } : { appointmentId: null }),
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.patientAllergy.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.patient.findUnique({
      where: { id: patientId },
      select: { noKnownDrugAllergies: true },
    }),
  ]);

  return {
    records,
    status,
    allergies,
    noKnownDrugAllergies: patient?.noKnownDrugAllergies ?? false,
  };
}

async function createRecord(patientId, data, user) {
  await assertPatientExists(patientId);

  const userName = formatUserName(user);
  const record = await prisma.patientIntakeRecord.create({
    data: {
      patientId,
      appointmentId: data.appointmentId || null,
      sectionType: data.sectionType,
      payload: data.payload,
      score: data.score ?? null,
      notes: data.notes || null,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
      createdByName: userName,
      updatedByName: userName,
    },
    include: {
      addendums: { where: NOT_DELETED, orderBy: { createdAt: 'asc' } },
    },
  });

  // Starting intake documentation = patient roomed / In Intake
  if (data.appointmentId) {
    await advanceEncounterStatus(data.appointmentId, ENCOUNTER_VISIT_STATUS.IN_INTAKE);
  }

  return record;
}

async function updateRecord(patientId, recordId, data, user) {
  const existing = await prisma.patientIntakeRecord.findFirst({
    where: { id: recordId, patientId, ...NOT_DELETED },
  });
  if (!existing) {
    const err = new Error('Intake record not found');
    err.statusCode = 404;
    throw err;
  }

  const userName = formatUserName(user);
  const record = await prisma.patientIntakeRecord.update({
    where: { id: recordId },
    data: {
      ...(data.payload !== undefined ? { payload: data.payload } : {}),
      ...(data.score !== undefined ? { score: data.score } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      updatedBy: user?.id || null,
      updatedByName: userName,
    },
    include: {
      addendums: { where: NOT_DELETED, orderBy: { createdAt: 'asc' } },
    },
  });

  // Editing intake content also means the patient is in intake / roomed
  if (existing.appointmentId) {
    await advanceEncounterStatus(existing.appointmentId, ENCOUNTER_VISIT_STATUS.IN_INTAKE);
  }

  return record;
}

async function addAddendum(patientId, recordId, data, user) {
  const parent = await prisma.patientIntakeRecord.findFirst({
    where: { id: recordId, patientId, ...NOT_DELETED, isAddendum: false },
  });
  if (!parent) {
    const err = new Error('Intake record not found');
    err.statusCode = 404;
    throw err;
  }

  const userName = formatUserName(user);
  const [addendum, updatedParent] = await prisma.$transaction([
    prisma.patientIntakeRecord.create({
      data: {
        patientId,
        appointmentId: parent.appointmentId,
        sectionType: parent.sectionType,
        payload: data.payload,
        notes: data.notes || null,
        isAddendum: true,
        parentId: parent.id,
        createdBy: user?.id || null,
        updatedBy: user?.id || null,
        createdByName: userName,
        updatedByName: userName,
      },
    }),
    prisma.patientIntakeRecord.update({
      where: { id: parent.id },
      data: {
        payload: data.payload,
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        updatedBy: user?.id || null,
        updatedByName: userName,
      },
    }),
  ]);

  return { addendum, parent: updatedParent };
}

async function deleteRecord(patientId, recordId) {
  const existing = await prisma.patientIntakeRecord.findFirst({
    where: { id: recordId, patientId, ...NOT_DELETED },
  });
  if (!existing) {
    const err = new Error('Intake record not found');
    err.statusCode = 404;
    throw err;
  }

  await prisma.patientIntakeRecord.update({
    where: { id: recordId },
    data: { isDeleted: true },
  });
}

async function certifyIntake(patientId, { appointmentId }, user) {
  await assertPatientExists(patientId);
  const userName = formatUserName(user);
  const now = new Date();

  const existing = await prisma.patientIntakeStatus.findFirst({
    where: {
      patientId,
      appointmentId: appointmentId || null,
    },
  });

  if (existing) {
    return prisma.patientIntakeStatus.update({
      where: { id: existing.id },
      data: {
        certifiedAt: now,
        certifiedBy: user?.id || null,
        certifiedByName: userName,
        status: 'certified',
      },
    });
  }

  return prisma.patientIntakeStatus.create({
    data: {
      patientId,
      appointmentId: appointmentId || null,
      certifiedAt: now,
      certifiedBy: user?.id || null,
      certifiedByName: userName,
      status: 'certified',
    },
  });
}

async function completeIntake(patientId, { appointmentId, completionNotes }, user) {
  await assertPatientExists(patientId);
  const userName = formatUserName(user);
  const now = new Date();

  const existing = await prisma.patientIntakeStatus.findFirst({
    where: {
      patientId,
      appointmentId: appointmentId || null,
    },
  });

  let status;
  if (existing) {
    status = await prisma.patientIntakeStatus.update({
      where: { id: existing.id },
      data: {
        completedAt: now,
        completedBy: user?.id || null,
        completedByName: userName,
        completionNotes: completionNotes || null,
        status: 'completed',
      },
    });
  } else {
    status = await prisma.patientIntakeStatus.create({
      data: {
        patientId,
        appointmentId: appointmentId || null,
        completedAt: now,
        completedBy: user?.id || null,
        completedByName: userName,
        completionNotes: completionNotes || null,
        status: 'completed',
      },
    });
  }

  // Intake completed → patient is with provider
  if (appointmentId) {
    await advanceEncounterStatus(appointmentId, ENCOUNTER_VISIT_STATUS.WITH_PROVIDER);
  }

  return status;
}

async function listAllergies(patientId) {
  await assertPatientExists(patientId);
  const [allergies, patient] = await Promise.all([
    prisma.patientAllergy.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.patient.findUnique({
      where: { id: patientId },
      select: { noKnownDrugAllergies: true },
    }),
  ]);
  return { allergies, noKnownDrugAllergies: patient?.noKnownDrugAllergies ?? false };
}

async function createAllergy(patientId, data) {
  await assertPatientExists(patientId);
  const allergy = await prisma.patientAllergy.create({
    data: {
      patientId,
      allergenName: data.allergenName,
      reaction: data.reaction || null,
      severity: data.severity || null,
      onsetDate: data.onsetDate ? new Date(data.onsetDate) : null,
      status: data.status || 'Active',
      comment: data.comment || null,
    },
  });
  if (data.clearNkda) {
    await prisma.patient.update({
      where: { id: patientId },
      data: { noKnownDrugAllergies: false },
    });
  }
  return allergy;
}

async function updateAllergy(patientId, allergyId, data) {
  const existing = await prisma.patientAllergy.findFirst({
    where: { id: allergyId, patientId },
  });
  if (!existing) {
    const err = new Error('Allergy not found');
    err.statusCode = 404;
    throw err;
  }
  return prisma.patientAllergy.update({
    where: { id: allergyId },
    data: {
      ...(data.allergenName !== undefined ? { allergenName: data.allergenName } : {}),
      ...(data.reaction !== undefined ? { reaction: data.reaction || null } : {}),
      ...(data.severity !== undefined ? { severity: data.severity || null } : {}),
      ...(data.onsetDate !== undefined
        ? { onsetDate: data.onsetDate ? new Date(data.onsetDate) : null }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.comment !== undefined ? { comment: data.comment || null } : {}),
    },
  });
}

async function deleteAllergy(patientId, allergyId) {
  const existing = await prisma.patientAllergy.findFirst({
    where: { id: allergyId, patientId },
  });
  if (!existing) {
    const err = new Error('Allergy not found');
    err.statusCode = 404;
    throw err;
  }
  await prisma.patientAllergy.delete({ where: { id: allergyId } });
}

async function setNkda(patientId, noKnownDrugAllergies) {
  await assertPatientExists(patientId);
  if (noKnownDrugAllergies) {
    await prisma.patientAllergy.deleteMany({ where: { patientId } });
  }
  return prisma.patient.update({
    where: { id: patientId },
    data: { noKnownDrugAllergies },
    select: { id: true, noKnownDrugAllergies: true },
  });
}

module.exports = {
  getIntakeBundle,
  createRecord,
  updateRecord,
  addAddendum,
  deleteRecord,
  certifyIntake,
  completeIntake,
  listAllergies,
  createAllergy,
  updateAllergy,
  deleteAllergy,
  setNkda,
};
