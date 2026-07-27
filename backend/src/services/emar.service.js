const prisma = require('../lib/prisma');
const {
  createMarEntryForOrder,
  EMAR_HANDLING_METHODS,
  syncPharmacyOrdersToEmar,
} = require('./emarMar.helper');

const MAR_STATUS_OPTIONS = [
  'Pending',
  'Due',
  'Administered',
  'Completed',
  'Missed',
  'Refused',
  'Held',
  'Cancelled',
  'Discontinued',
  'Expired',
];

const ADMINISTRATION_STATUS_OPTIONS = [
  'Administered',
  'Held',
  'Refused',
  'Missed',
  'Not Available',
  'Delayed',
];

const TAB_FILTERS = {
  active: ['Pending', 'Due', 'Held'],
  scheduled: ['Due', 'Pending'],
  administered: ['Administered', 'Completed'],
  prn: null,
  missed: ['Missed'],
  refused: ['Refused'],
  discontinued: ['Discontinued', 'Cancelled', 'Expired'],
  samples: null,
  history: null,
};

const orderInclude = {
  medicationOrder: {
    select: {
      id: true,
      medicationName: true,
      medicationCode: true,
      medicationClass: true,
      strength: true,
      dosageForm: true,
      handlingMethod: true,
      status: true,
      dose: true,
      unit: true,
      route: true,
      frequency: true,
      duration: true,
      prn: true,
      sigPreview: true,
      additionalInstructions: true,
      sampleNdc: true,
      sampleLotNumber: true,
      formularyTier: true,
      ndcSafetyFlag: true,
      prescriber: true,
      orderedBy: true,
      signedBy: true,
      signedAt: true,
      safetyAlerts: true,
      safetyAcknowledged: true,
    },
  },
};

function emptyToNull(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = timeStr || '00:00';
  const d = new Date(`${dateStr}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

function mapMarStatusFromAdministration(status) {
  const map = {
    Administered: 'Administered',
    Held: 'Held',
    Refused: 'Refused',
    Missed: 'Missed',
    'Not Available': 'Pending',
    Delayed: 'Due',
  };
  return map[status] || 'Pending';
}

function serializeMarEntry(row, lastRecord = null) {
  const order = row.medicationOrder;
  return {
    id: row.id,
    medicationOrderId: row.medicationOrderId,
    patientId: row.patientId,
    appointmentId: row.appointmentId,
    marStatus: row.marStatus,
    startDate: row.startDate,
    endDate: row.endDate,
    nextDueAt: row.nextDueAt,
    lastAdministeredAt: row.lastAdministeredAt,
    discontinuedAt: row.discontinuedAt,
    discontinuedBy: row.discontinuedBy,
    discontinueReason: row.discontinueReason,
    sampleNdc: row.sampleNdc,
    sampleLotNumber: row.sampleLotNumber,
    sampleExpirationDate: row.sampleExpirationDate,
    sampleQuantity: row.sampleQuantity,
    medicationName: order?.medicationName,
    medicationCode: order?.medicationCode,
    medicationClass: order?.medicationClass,
    strength: order?.strength,
    dosageForm: order?.dosageForm,
    handlingMethod: order?.handlingMethod,
    orderStatus: order?.status,
    dose: order?.dose,
    unit: order?.unit,
    route: order?.route,
    frequency: order?.frequency,
    duration: order?.duration,
    prn: order?.prn,
    sigPreview: order?.sigPreview,
    additionalInstructions: order?.additionalInstructions,
    prescriber: order?.prescriber,
    orderedBy: order?.orderedBy,
    signedBy: order?.signedBy,
    signedAt: order?.signedAt,
    safetyAlerts: order?.safetyAlerts,
    safetyAcknowledged: order?.safetyAcknowledged,
    lastAdministration: lastRecord
      ? {
          status: lastRecord.administrationStatus,
          administeredAt: lastRecord.administeredAt,
          administeredByName: lastRecord.administeredByName,
          doseGiven: lastRecord.doseGiven,
          route: lastRecord.route,
        }
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serializeAdminRecord(row) {
  return {
    id: row.id,
    marEntryId: row.marEntryId,
    medicationOrderId: row.medicationOrderId,
    patientId: row.patientId,
    administrationStatus: row.administrationStatus,
    administeredAt: row.administeredAt,
    doseGiven: row.doseGiven,
    route: row.route,
    site: row.site,
    administeredBy: row.administeredBy,
    administeredByName: row.administeredByName,
    witnessRequired: row.witnessRequired,
    witnessName: row.witnessName,
    comments: row.comments,
    holdReason: row.holdReason,
    refusalReason: row.refusalReason,
    missedReason: row.missedReason,
    prnReason: row.prnReason,
    symptomSeverity: row.symptomSeverity,
    preAssessment: row.preAssessment,
    postAssessment: row.postAssessment,
    effectivenessEvaluation: row.effectivenessEvaluation,
    fiveRightsVerified: row.fiveRightsVerified,
    safetyAlerts: row.safetyAlerts,
    safetyAcknowledged: row.safetyAcknowledged,
    signatureUsername: row.signatureUsername,
    signatureMeaning: row.signatureMeaning,
    signatureTimestamp: row.signatureTimestamp,
    medicationName: row.marEntry?.medicationOrder?.medicationName,
    strength: row.marEntry?.medicationOrder?.strength,
    createdAt: row.createdAt,
  };
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

async function syncFromSignedOrders(patientId, appointmentId) {
  // Chart Pharmacy orders (Orders tab) should always surface on eMAR.
  await syncPharmacyOrdersToEmar(patientId, appointmentId || null);

  const where = {
    patientId,
    handlingMethod: { in: EMAR_HANDLING_METHODS },
    status: { in: ['Signed', 'Verified', 'Completed'] },
    ...(appointmentId ? { appointmentId } : {}),
  };

  const orders = await prisma.medicationOrder.findMany({ where });
  for (const order of orders) {
    await createMarEntryForOrder(order);
  }
}

async function findAll(patientId, filters = {}) {
  await assertPatientExists(patientId);
  await syncFromSignedOrders(patientId, filters.appointmentId);

  const where = {
    patientId,
    ...(filters.appointmentId ? { appointmentId: filters.appointmentId } : {}),
  };

  const tab = filters.tab || 'active';
  if (tab === 'samples') {
    where.medicationOrder = { handlingMethod: 'sample_given' };
  } else if (tab === 'prn') {
    where.medicationOrder = { prn: true };
    where.marStatus = { notIn: ['Discontinued', 'Cancelled', 'Expired'] };
  } else if (tab === 'scheduled') {
    where.marStatus = { in: TAB_FILTERS.scheduled };
    where.nextDueAt = { not: null };
  } else if (tab === 'history') {
    // handled separately via administration records
  } else if (TAB_FILTERS[tab]) {
    where.marStatus = { in: TAB_FILTERS[tab] };
  }

  if (filters.marStatus) {
    where.marStatus = filters.marStatus;
  }
  if (filters.route) {
    where.medicationOrder = { ...(where.medicationOrder || {}), route: filters.route };
  }
  if (filters.handlingMethod) {
    where.medicationOrder = {
      ...(where.medicationOrder || {}),
      handlingMethod: filters.handlingMethod,
    };
  }

  const rows = await prisma.medicationMarEntry.findMany({
    where,
    include: {
      ...orderInclude,
      administrationRecords: {
        orderBy: { administeredAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ nextDueAt: 'asc' }, { createdAt: 'desc' }],
  });

  let entries = rows.map((row) =>
    serializeMarEntry(row, row.administrationRecords[0] || null),
  );

  if (filters.search) {
    const q = filters.search.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.medicationName?.toLowerCase().includes(q) ||
        e.medicationCode?.toLowerCase().includes(q) ||
        e.orderedBy?.toLowerCase().includes(q) ||
        e.prescriber?.toLowerCase().includes(q),
    );
  }

  if (filters.provider) {
    const p = filters.provider.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.orderedBy?.toLowerCase().includes(p) ||
        e.prescriber?.toLowerCase().includes(p),
    );
  }

  if (filters.administrationUser) {
    const u = filters.administrationUser.toLowerCase();
    entries = entries.filter((e) =>
      e.lastAdministration?.administeredByName?.toLowerCase().includes(u),
    );
  }

  return entries;
}

async function getHistory(patientId, filters = {}) {
  await assertPatientExists(patientId);

  const where = {
    patientId,
    ...(filters.appointmentId
      ? { marEntry: { appointmentId: filters.appointmentId } }
      : {}),
  };

  if (filters.dateFrom || filters.dateTo) {
    where.administeredAt = {};
    if (filters.dateFrom) where.administeredAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      where.administeredAt.lte = end;
    }
  }

  const rows = await prisma.medicationAdministrationRecord.findMany({
    where,
    include: {
      marEntry: {
        include: orderInclude,
      },
    },
    orderBy: [{ administeredAt: 'desc' }, { createdAt: 'desc' }],
  });

  return rows.map(serializeAdminRecord);
}

async function getTabCounts(patientId, appointmentId) {
  await assertPatientExists(patientId);
  await syncFromSignedOrders(patientId, appointmentId);

  const baseWhere = {
    patientId,
    ...(appointmentId ? { appointmentId } : {}),
  };

  const entries = await prisma.medicationMarEntry.findMany({
    where: baseWhere,
    include: { medicationOrder: { select: { prn: true, handlingMethod: true } } },
  });

  const counts = {
    active: 0,
    scheduled: 0,
    administered: 0,
    prn: 0,
    missed: 0,
    refused: 0,
    discontinued: 0,
    samples: 0,
    history: 0,
  };

  for (const entry of entries) {
    const s = entry.marStatus;
    if (TAB_FILTERS.active.includes(s)) counts.active += 1;
    if (TAB_FILTERS.scheduled.includes(s) && entry.nextDueAt) counts.scheduled += 1;
    if (TAB_FILTERS.administered.includes(s)) counts.administered += 1;
    if (TAB_FILTERS.missed.includes(s)) counts.missed += 1;
    if (TAB_FILTERS.refused.includes(s)) counts.refused += 1;
    if (TAB_FILTERS.discontinued.includes(s)) counts.discontinued += 1;
    if (entry.medicationOrder?.handlingMethod === 'sample_given') counts.samples += 1;
    if (entry.medicationOrder?.prn && !TAB_FILTERS.discontinued.includes(s)) counts.prn += 1;
  }

  counts.history = await prisma.medicationAdministrationRecord.count({
    where: {
      patientId,
      ...(appointmentId ? { marEntry: { appointmentId } } : {}),
    },
  });

  return counts;
}

async function findById(patientId, marEntryId) {
  await assertPatientExists(patientId);
  const row = await prisma.medicationMarEntry.findFirst({
    where: { id: marEntryId, patientId },
    include: {
      ...orderInclude,
      administrationRecords: {
        orderBy: { administeredAt: 'desc' },
        take: 1,
      },
    },
  });
  if (!row) return null;
  return serializeMarEntry(row, row.administrationRecords[0] || null);
}

async function getAdministrationHistory(patientId, marEntryId) {
  await assertPatientExists(patientId);
  const entry = await prisma.medicationMarEntry.findFirst({
    where: { id: marEntryId, patientId },
    select: { id: true },
  });
  if (!entry) {
    const err = new Error('MAR entry not found');
    err.statusCode = 404;
    throw err;
  }

  const rows = await prisma.medicationAdministrationRecord.findMany({
    where: { marEntryId },
    include: {
      marEntry: { include: orderInclude },
    },
    orderBy: [{ administeredAt: 'desc' }, { createdAt: 'desc' }],
  });

  return rows.map(serializeAdminRecord);
}

async function recordAdministration(patientId, marEntryId, body, user) {
  await assertPatientExists(patientId);

  const entry = await prisma.medicationMarEntry.findFirst({
    where: { id: marEntryId, patientId },
    include: { medicationOrder: true },
  });
  if (!entry) {
    const err = new Error('MAR entry not found');
    err.statusCode = 404;
    throw err;
  }

  const status = body.administrationStatus;
  if (!ADMINISTRATION_STATUS_OPTIONS.includes(status)) {
    const err = new Error('Invalid administration status');
    err.statusCode = 400;
    throw err;
  }

  const order = entry.medicationOrder;

  if (order.prn && status === 'Administered' && !emptyToNull(body.prnReason)) {
    const err = new Error('PRN reason is required before administering PRN medication');
    err.statusCode = 400;
    throw err;
  }

  if (status === 'Held' && !emptyToNull(body.holdReason)) {
    const err = new Error('Hold reason is required');
    err.statusCode = 400;
    throw err;
  }
  if (status === 'Refused' && !emptyToNull(body.refusalReason)) {
    const err = new Error('Refusal reason is required');
    err.statusCode = 400;
    throw err;
  }
  if (status === 'Missed' && !emptyToNull(body.missedReason)) {
    const err = new Error('Missed reason is required');
    err.statusCode = 400;
    throw err;
  }

  const alerts = Array.isArray(body.safetyAlerts) ? body.safetyAlerts : [];
  const critical = alerts.filter((a) => a.severity === 'Critical');
  if (critical.length > 0 && !body.safetyAcknowledged) {
    const err = new Error('Critical safety alerts must be acknowledged before administration');
    err.statusCode = 400;
    throw err;
  }

  const administeredAt =
    parseDateTime(body.administrationDate, body.administrationTime) || new Date();

  const record = await prisma.medicationAdministrationRecord.create({
    data: {
      marEntryId: entry.id,
      medicationOrderId: entry.medicationOrderId,
      patientId,
      administrationStatus: status,
      administeredAt,
      doseGiven: emptyToNull(body.doseGiven) || order.dose,
      route: emptyToNull(body.route) || order.route,
      site: emptyToNull(body.site),
      administeredBy: user?.id || null,
      administeredByName: user?.name || user?.email || null,
      witnessRequired: Boolean(body.witnessRequired),
      witnessName: emptyToNull(body.witnessName),
      witnessUserId: emptyToNull(body.witnessUserId),
      comments: emptyToNull(body.comments),
      holdReason: emptyToNull(body.holdReason),
      refusalReason: emptyToNull(body.refusalReason),
      missedReason: emptyToNull(body.missedReason),
      prnReason: emptyToNull(body.prnReason),
      symptomSeverity: emptyToNull(body.symptomSeverity),
      preAssessment: emptyToNull(body.preAssessment),
      postAssessment: emptyToNull(body.postAssessment),
      effectivenessEvaluation: emptyToNull(body.effectivenessEvaluation),
      fiveRightsVerified: body.fiveRightsVerified || null,
      safetyAlerts: alerts.length ? alerts : null,
      safetyAcknowledged: Boolean(body.safetyAcknowledged),
      signatureUsername: emptyToNull(body.signatureUsername),
      signatureMeaning: emptyToNull(body.signatureMeaning),
      signatureTimestamp: body.signatureTimestamp ? new Date(body.signatureTimestamp) : null,
    },
    include: {
      marEntry: { include: orderInclude },
    },
  });

  const marStatus = mapMarStatusFromAdministration(status);
  const patch = {
    marStatus,
    updatedAt: new Date(),
  };

  if (status === 'Administered') {
    patch.lastAdministeredAt = administeredAt;
    if (order.duration && /ongoing/i.test(order.duration)) {
      patch.marStatus = 'Administered';
    } else if (order.duration) {
      patch.marStatus = 'Completed';
    }
  }

  if (status === 'Delayed') {
    patch.marStatus = 'Due';
    patch.nextDueAt = administeredAt;
  }

  await prisma.medicationMarEntry.update({
    where: { id: entry.id },
    data: patch,
  });

  if (patch.marStatus === 'Completed') {
    await prisma.medicationOrder.update({
      where: { id: entry.medicationOrderId },
      data: { status: 'Completed', completedAt: new Date() },
    });
  }

  return serializeAdminRecord(record);
}

async function discontinue(patientId, marEntryId, body, user) {
  await assertPatientExists(patientId);
  const entry = await prisma.medicationMarEntry.findFirst({
    where: { id: marEntryId, patientId },
  });
  if (!entry) {
    const err = new Error('MAR entry not found');
    err.statusCode = 404;
    throw err;
  }

  const row = await prisma.medicationMarEntry.update({
    where: { id: marEntryId },
    data: {
      marStatus: 'Discontinued',
      discontinuedAt: new Date(),
      discontinuedBy: user?.name || user?.email || null,
      discontinueReason: emptyToNull(body.reason),
    },
    include: {
      ...orderInclude,
      administrationRecords: { orderBy: { administeredAt: 'desc' }, take: 1 },
    },
  });

  await prisma.medicationOrder.update({
    where: { id: entry.medicationOrderId },
    data: { status: 'Cancelled', cancelledAt: new Date() },
  });

  return serializeMarEntry(row, row.administrationRecords[0] || null);
}

async function getPatientPanel(patientId, appointmentId) {
  await assertPatientExists(patientId);

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
    select: {
      id: true,
      mrn: true,
      firstName: true,
      middleName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      noKnownDrugAllergies: true,
    },
  });

  let appointment = null;
  if (appointmentId) {
    appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, patientId },
      include: {
        providerRef: {
          select: { firstName: true, middleName: true, lastName: true },
        },
        departmentRef: { select: { departmentName: true, facilityName: true } },
        appointmentTypeRef: { select: { name: true } },
      },
    });
  }

  const allergies = await prisma.patientAllergy.findMany({
    where: { patientId, status: 'Active' },
    select: { id: true, allergenName: true, severity: true, reaction: true },
    orderBy: { allergenName: 'asc' },
  });

  let vitals = null;
  if (appointmentId) {
    const intake = await prisma.patientIntakeRecord.findFirst({
      where: { patientId, appointmentId, sectionType: 'vitals' },
      orderBy: { updatedAt: 'desc' },
      select: { payload: true },
    });
    if (intake?.payload && typeof intake.payload === 'object') {
      vitals = intake.payload;
    }
  }

  const providerName = appointment?.providerRef
    ? [appointment.providerRef.firstName, appointment.providerRef.middleName, appointment.providerRef.lastName]
        .filter(Boolean)
        .join(' ')
    : appointment?.provider || null;

  return {
    patientName: [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' '),
    mrn: patient.mrn,
    dateOfBirth: patient.dateOfBirth,
    age: computeAge(patient.dateOfBirth),
    gender: patient.gender,
    encounterNumber: appointment?.id || null,
    provider: providerName,
    allergies: patient.noKnownDrugAllergies
      ? [{ allergenName: 'No Known Drug Allergies', severity: null }]
      : allergies,
    weight: vitals?.weight ?? vitals?.weightKg ?? null,
    height: vitals?.height ?? vitals?.heightCm ?? null,
    currentLocation:
      appointment?.departmentRef?.facilityName ||
      appointment?.departmentRef?.departmentName ||
      appointment?.department ||
      null,
    visitType: appointment?.appointmentTypeRef?.name || appointment?.status || null,
  };
}

async function getTimeline(patientId, appointmentId) {
  await assertPatientExists(patientId);

  const marWhere = {
    patientId,
    ...(appointmentId ? { appointmentId } : {}),
  };

  const [entries, adminRecords, orderAudits] = await Promise.all([
    prisma.medicationMarEntry.findMany({
      where: marWhere,
      include: { medicationOrder: { select: { medicationName: true, orderedBy: true, signedBy: true, signedAt: true } } },
    }),
    prisma.medicationAdministrationRecord.findMany({
      where: { patientId, ...(appointmentId ? { marEntry: { appointmentId } } : {}) },
      include: { marEntry: { include: { medicationOrder: { select: { medicationName: true } } } } },
      orderBy: { administeredAt: 'desc' },
    }),
    prisma.medicationOrderAuditLog.findMany({
      where: {
        medicationOrder: {
          patientId,
          handlingMethod: { in: EMAR_HANDLING_METHODS },
          ...(appointmentId ? { appointmentId } : {}),
        },
      },
      include: { medicationOrder: { select: { medicationName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const events = [];

  for (const entry of entries) {
    if (entry.medicationOrder?.signedAt) {
      events.push({
        type: 'medication_ordered',
        timestamp: entry.medicationOrder.signedAt,
        user: entry.medicationOrder.signedBy || entry.medicationOrder.orderedBy,
        medicationName: entry.medicationOrder.medicationName,
        details: 'Medication order signed',
      });
    }
    if (entry.discontinuedAt) {
      events.push({
        type: 'medication_discontinued',
        timestamp: entry.discontinuedAt,
        user: entry.discontinuedBy,
        medicationName: entry.medicationOrder?.medicationName,
        details: entry.discontinueReason,
      });
    }
  }

  for (const rec of adminRecords) {
    const typeMap = {
      Administered: 'medication_administered',
      Held: 'medication_held',
      Refused: 'medication_refused',
      Missed: 'medication_missed',
      Delayed: 'medication_delayed',
    };
    events.push({
      type: typeMap[rec.administrationStatus] || 'medication_event',
      timestamp: rec.administeredAt || rec.createdAt,
      user: rec.administeredByName,
      medicationName: rec.marEntry?.medicationOrder?.medicationName,
      details: rec.comments || rec.administrationStatus,
      status: rec.administrationStatus,
    });
    if (rec.administrationStatus === 'Administered') {
      events.push({
        type: 'medication_completed',
        timestamp: rec.administeredAt || rec.createdAt,
        user: rec.administeredByName,
        medicationName: rec.marEntry?.medicationOrder?.medicationName,
        details: 'Administration completed',
      });
    }
  }

  for (const audit of orderAudits) {
    if (audit.action === 'medication_signed') {
      continue;
    }
    events.push({
      type: audit.action,
      timestamp: audit.createdAt,
      user: audit.userName,
      medicationName: audit.medicationOrder?.medicationName,
      details: audit.action.replace(/_/g, ' '),
    });
  }

  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return events;
}

module.exports = {
  MAR_STATUS_OPTIONS,
  ADMINISTRATION_STATUS_OPTIONS,
  findAll,
  getHistory,
  getTabCounts,
  findById,
  getAdministrationHistory,
  recordAdministration,
  discontinue,
  getPatientPanel,
  getTimeline,
  syncFromSignedOrders,
};
