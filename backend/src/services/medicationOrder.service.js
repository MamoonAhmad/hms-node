const prisma = require('../lib/prisma');
const { createMarEntryForOrder, EMAR_HANDLING_METHODS } = require('./emarMar.helper');

const STATUS_OPTIONS = ['Draft', 'Signed', 'Verified', 'Sent', 'Completed', 'Cancelled'];
const HANDLING_OPTIONS = ['give_in_clinic', 'sample_given', 'send_to_pharmacy', 'print'];

function emptyToNull(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

function serializeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patientId,
    appointmentId: row.appointmentId,
    medicationCatalogId: row.medicationCatalogId,
    medicationName: row.medicationName,
    medicationCode: row.medicationCode,
    medicationClass: row.medicationClass,
    strength: row.strength,
    dosageForm: row.dosageForm,
    formularyTier: row.formularyTier,
    ndcSafetyFlag: row.ndcSafetyFlag,
    handlingMethod: row.handlingMethod,
    status: row.status,
    dose: row.dose,
    unit: row.unit,
    route: row.route,
    frequency: row.frequency,
    duration: row.duration,
    prn: row.prn,
    sigPreview: row.sigPreview,
    additionalInstructions: row.additionalInstructions,
    sampleNdc: row.sampleNdc,
    sampleLotNumber: row.sampleLotNumber,
    pharmacy: row.pharmacy,
    quantity: row.quantity,
    refills: row.refills,
    daysSupply: row.daysSupply,
    substitutionAllowed: row.substitutionAllowed,
    prescriber: row.prescriber,
    eRxStatus: row.eRxStatus,
    safetyAlerts: row.safetyAlerts,
    safetyAcknowledged: row.safetyAcknowledged,
    orderedBy: row.orderedBy,
    signedBy: row.signedBy,
    signedAt: row.signedAt,
    verifiedBy: row.verifiedBy,
    verifiedAt: row.verifiedAt,
    sentAt: row.sentAt,
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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

async function writeAuditLog(medicationOrderId, action, user, details = null) {
  await prisma.medicationOrderAuditLog.create({
    data: {
      medicationOrderId,
      action,
      details: details || undefined,
      userId: user?.id || null,
      userName: user?.name || user?.email || null,
    },
  });
}

async function findAll(patientId, filters = {}) {
  await assertPatientExists(patientId);

  const where = {
    patientId,
    ...(filters.appointmentId ? { appointmentId: filters.appointmentId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const rows = await prisma.medicationOrder.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
  });

  return rows.map(serializeRow);
}

async function findById(patientId, orderId) {
  await assertPatientExists(patientId);
  const row = await prisma.medicationOrder.findFirst({
    where: { id: orderId, patientId },
  });
  return serializeRow(row);
}

function buildSigPreview({ dose, unit, route, frequency, duration, prn }) {
  const parts = [];
  if (dose && unit) parts.push(`${dose} ${unit}`);
  if (route) parts.push(`by ${route.toLowerCase().replace(/^by mouth \(po\)$/i, 'mouth')}`);
  if (frequency) parts.push(frequency.toLowerCase());
  if (duration) parts.push(`for ${duration}`);
  if (prn) parts.push('as needed');
  if (!parts.length) return null;
  return `Take ${parts.join(' ')}`.replace(/\s+/g, ' ').trim();
}

function validateOrderPayload(body, { requireHandling = true } = {}) {
  if (!body.medicationName?.trim()) {
    const err = new Error('Medication selection is required');
    err.statusCode = 400;
    throw err;
  }
  if (requireHandling && !body.handlingMethod) {
    const err = new Error('Handling method is required');
    err.statusCode = 400;
    throw err;
  }
  if (body.handlingMethod && !HANDLING_OPTIONS.includes(body.handlingMethod)) {
    const err = new Error('Invalid handling method');
    err.statusCode = 400;
    throw err;
  }
  for (const field of ['dose', 'unit', 'route', 'frequency', 'duration']) {
    if (!body[field]?.trim()) {
      const err = new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      err.statusCode = 400;
      throw err;
    }
  }
  if (body.handlingMethod === 'sample_given') {
    if (!body.sampleNdc?.trim()) {
      const err = new Error('NDC is required when Sample Given is selected');
      err.statusCode = 400;
      throw err;
    }
    if (!body.sampleLotNumber?.trim()) {
      const err = new Error('Lot Number is required when Sample Given is selected');
      err.statusCode = 400;
      throw err;
    }
  }
  const alerts = Array.isArray(body.safetyAlerts) ? body.safetyAlerts : [];
  const blocking = alerts.filter((a) => a.severity === 'Critical' || a.severity === 'Warning');
  if (blocking.length > 0 && !body.safetyAcknowledged) {
    const err = new Error('Safety alerts must be reviewed and acknowledged before adding to draft orders');
    err.statusCode = 400;
    throw err;
  }
}

function mapCreateData(patientId, body, user) {
  const sigPreview = body.sigPreview || buildSigPreview(body);
  return {
    patientId,
    appointmentId: emptyToNull(body.appointmentId),
    medicationCatalogId: emptyToNull(body.medicationCatalogId),
    medicationName: body.medicationName.trim(),
    medicationCode: emptyToNull(body.medicationCode),
    medicationClass: emptyToNull(body.medicationClass),
    strength: emptyToNull(body.strength),
    dosageForm: emptyToNull(body.dosageForm),
    formularyTier: emptyToNull(body.formularyTier),
    ndcSafetyFlag: emptyToNull(body.ndcSafetyFlag),
    handlingMethod: body.handlingMethod,
    status: body.status || 'Draft',
    dose: emptyToNull(body.dose),
    unit: emptyToNull(body.unit),
    route: emptyToNull(body.route),
    frequency: emptyToNull(body.frequency),
    duration: emptyToNull(body.duration),
    prn: Boolean(body.prn),
    sigPreview,
    additionalInstructions: emptyToNull(body.additionalInstructions),
    sampleNdc: emptyToNull(body.sampleNdc),
    sampleLotNumber: emptyToNull(body.sampleLotNumber),
    pharmacy: emptyToNull(body.pharmacy),
    quantity: body.quantity != null ? Number(body.quantity) : null,
    refills: body.refills != null ? Number(body.refills) : null,
    daysSupply: body.daysSupply != null ? Number(body.daysSupply) : null,
    substitutionAllowed: body.substitutionAllowed !== false,
    prescriber: emptyToNull(body.prescriber) || user?.name || user?.email || null,
    eRxStatus: emptyToNull(body.eRxStatus),
    safetyAlerts: body.safetyAlerts || null,
    safetyAcknowledged: Boolean(body.safetyAcknowledged),
    orderedBy: user?.name || user?.email || null,
    createdBy: user?.id || null,
    updatedBy: user?.id || null,
  };
}

async function create(patientId, body, user) {
  await assertPatientExists(patientId);
  validateOrderPayload(body);

  const data = mapCreateData(patientId, body, user);
  const row = await prisma.medicationOrder.create({ data });

  await writeAuditLog(row.id, 'medication_added_to_draft', user, {
    medicationName: row.medicationName,
    handlingMethod: row.handlingMethod,
  });
  if (body.safetyAlerts?.length) {
    await writeAuditLog(row.id, 'safety_check_generated', user, { alerts: body.safetyAlerts });
  }
  if (body.safetyAcknowledged) {
    await writeAuditLog(row.id, 'safety_alert_acknowledged', user);
  }

  return serializeRow(row);
}

async function bulkSave(patientId, { orders = [], appointmentId }, user) {
  await assertPatientExists(patientId);
  const results = [];

  for (const item of orders) {
    if (item.id) {
      const existing = await prisma.medicationOrder.findFirst({
        where: { id: item.id, patientId, status: 'Draft' },
      });
      if (!existing) continue;
      validateOrderPayload(item);
      const sigPreview = item.sigPreview || buildSigPreview(item);
      const updated = await prisma.medicationOrder.update({
        where: { id: item.id },
        data: {
          ...mapCreateData(patientId, { ...item, appointmentId: appointmentId || item.appointmentId }, user),
          sigPreview,
          status: 'Draft',
        },
      });
      await writeAuditLog(updated.id, 'draft_saved', user);
      results.push(serializeRow(updated));
    } else {
      const created = await create(
        patientId,
        { ...item, appointmentId: appointmentId || item.appointmentId, status: 'Draft' },
        user,
      );
      results.push(created);
    }
  }

  return results;
}

async function updateStatus(patientId, orderId, status, user, extra = {}) {
  await assertPatientExists(patientId);
  if (!STATUS_OPTIONS.includes(status)) {
    const err = new Error('Invalid status');
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.medicationOrder.findFirst({
    where: { id: orderId, patientId },
  });
  if (!existing) {
    const err = new Error('Medication order not found');
    err.statusCode = 404;
    throw err;
  }

  const now = new Date();
  const patch = {
    status,
    updatedBy: user?.id || null,
    ...extra,
  };

  if (status === 'Signed') {
    patch.signedBy = user?.name || user?.email || null;
    patch.signedAt = now;
  } else if (status === 'Verified') {
    patch.verifiedBy = user?.name || user?.email || null;
    patch.verifiedAt = now;
  } else if (status === 'Sent') {
    patch.sentAt = now;
    patch.eRxStatus = extra.eRxStatus || 'Transmitted';
  } else if (status === 'Completed') {
    patch.completedAt = now;
  } else if (status === 'Cancelled') {
    patch.cancelledAt = now;
  }

  const row = await prisma.medicationOrder.update({
    where: { id: orderId },
    data: patch,
  });

  const actionMap = {
    Signed: 'medication_signed',
    Verified: 'medication_verified',
    Sent: 'medication_sent_to_pharmacy',
    Completed: 'medication_completed',
    Cancelled: 'medication_cancelled',
  };
  if (actionMap[status]) {
    await writeAuditLog(orderId, actionMap[status], user);
  }

  if (status === 'Signed' && EMAR_HANDLING_METHODS.includes(row.handlingMethod)) {
    await createMarEntryForOrder(row, user);
  }

  return serializeRow(row);
}

async function bulkSign(patientId, orderIds, user) {
  await assertPatientExists(patientId);
  const results = [];
  for (const orderId of orderIds) {
    const row = await updateStatus(patientId, orderId, 'Signed', user);
    results.push(row);
  }
  return results;
}

async function acknowledgeSafety(patientId, orderId, user) {
  await assertPatientExists(patientId);
  const existing = await prisma.medicationOrder.findFirst({
    where: { id: orderId, patientId },
  });
  if (!existing) {
    const err = new Error('Medication order not found');
    err.statusCode = 404;
    throw err;
  }

  const row = await prisma.medicationOrder.update({
    where: { id: orderId },
    data: { safetyAcknowledged: true, updatedBy: user?.id || null },
  });

  await writeAuditLog(orderId, 'safety_alert_acknowledged', user);
  return serializeRow(row);
}

async function getAuditLogs(patientId, orderId) {
  await assertPatientExists(patientId);
  const existing = await prisma.medicationOrder.findFirst({
    where: { id: orderId, patientId },
    select: { id: true },
  });
  if (!existing) {
    const err = new Error('Medication order not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.medicationOrderAuditLog.findMany({
    where: { medicationOrderId: orderId },
    orderBy: { createdAt: 'desc' },
  });
}

async function getStatusCounts(patientId, appointmentId) {
  await assertPatientExists(patientId);
  const where = {
    patientId,
    ...(appointmentId ? { appointmentId } : {}),
  };

  const groups = await prisma.medicationOrder.groupBy({
    by: ['status'],
    where,
    _count: { status: true },
  });

  const counts = { All: 0, Draft: 0, Signed: 0, Verified: 0, Sent: 0, Completed: 0, Cancelled: 0 };
  for (const g of groups) {
    counts[g.status] = g._count.status;
    counts.All += g._count.status;
  }
  return counts;
}

module.exports = {
  STATUS_OPTIONS,
  HANDLING_OPTIONS,
  findAll,
  findById,
  create,
  bulkSave,
  updateStatus,
  bulkSign,
  acknowledgeSafety,
  getAuditLogs,
  getStatusCounts,
  buildSigPreview,
};
