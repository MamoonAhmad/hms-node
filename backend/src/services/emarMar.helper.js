const prisma = require('../lib/prisma');

const EMAR_HANDLING_METHODS = ['give_in_clinic', 'sample_given'];
const PHARMACY_ORDER_CATEGORIES = ['Pharmacy'];
const SKIP_PHARMACY_ORDER_STATUSES = ['Cancelled', 'Discontinue', 'Discontinued'];

const CATALOG_ROUTE_TO_SIG = {
  Oral: 'By Mouth (PO)',
  Sublingual: 'Sublingual (SL)',
  Topical: 'Topical',
  Intravenous: 'Intravenous (IV)',
  Intramuscular: 'Intramuscular (IM)',
  Subcutaneous: 'Subcutaneous (SC)',
  Inhalation: 'Inhalation',
  Ophthalmic: 'Topical',
  Nasal: 'Inhalation',
  Transdermal: 'Topical',
};

function parseDurationDays(duration) {
  if (!duration) return null;
  const match = String(duration).match(/(\d+)\s*days?/i);
  if (match) return Number(match[1]);
  if (/ongoing/i.test(duration)) return null;
  return null;
}

function computeEndDate(startDate, duration) {
  const days = parseDurationDays(duration);
  if (!startDate || !days) return null;
  const end = new Date(startDate);
  end.setDate(end.getDate() + days);
  return end;
}

function computeNextDueAt(order, startDate) {
  if (order.prn) return null;
  const base = startDate ? new Date(startDate) : new Date();
  const freq = String(order.frequency || '').toLowerCase();
  if (freq.includes('q6h') || freq.includes('every 6')) {
    base.setHours(base.getHours() + 6);
  } else if (freq.includes('q8h') || freq.includes('every 8')) {
    base.setHours(base.getHours() + 8);
  } else if (freq.includes('qid') || freq.includes('four times')) {
    base.setHours(base.getHours() + 6);
  } else if (freq.includes('tid') || freq.includes('three times')) {
    base.setHours(base.getHours() + 8);
  } else if (freq.includes('bid') || freq.includes('twice')) {
    base.setHours(base.getHours() + 12);
  } else if (freq.includes('qhs') || freq.includes('bedtime')) {
    base.setHours(21, 0, 0, 0);
    if (base <= new Date()) base.setDate(base.getDate() + 1);
  } else {
    base.setHours(base.getHours() + 24);
  }
  return base;
}

function firstRoute(route) {
  if (Array.isArray(route)) return route.find(Boolean) || '';
  return typeof route === 'string' ? route : '';
}

function mapCatalogRouteToSig(route) {
  const raw = firstRoute(route);
  if (!raw) return 'By Mouth (PO)';
  if (CATALOG_ROUTE_TO_SIG[raw]) return CATALOG_ROUTE_TO_SIG[raw];
  const lower = raw.toLowerCase();
  if (lower.includes('mouth') || lower.includes('oral') || lower === 'po') return 'By Mouth (PO)';
  if (lower.includes('iv') || lower.includes('intravenous')) return 'Intravenous (IV)';
  if (lower.includes('im') || lower.includes('intramuscular')) return 'Intramuscular (IM)';
  if (lower.includes('sc') || lower.includes('subcut')) return 'Subcutaneous (SC)';
  return raw;
}

function buildSigPreview({ dose, unit, route, frequency, duration }) {
  return `Take ${dose} ${unit} ${route} ${frequency} for ${duration}`.replace(/\s+/g, ' ').trim();
}

async function findCatalogForPharmacyOrder(order) {
  const code = String(order.procedureCode || '').trim();
  if (code) {
    const byCode = await prisma.medicationCatalog.findFirst({
      where: { deletedAt: null, OR: [{ code }, { ndc: code }] },
    });
    if (byCode) return byCode;
  }

  const name = String(order.procedureName || '').trim();
  if (!name) return null;
  return prisma.medicationCatalog.findFirst({
    where: {
      deletedAt: null,
      isActive: true,
      OR: [
        { name: { equals: name, mode: 'insensitive' } },
        { genericName: { equals: name, mode: 'insensitive' } },
        { brandName: { equals: name, mode: 'insensitive' } },
      ],
    },
  });
}

function buildMedicationFieldsFromPharmacyOrder(order, catalog) {
  const doseFromStrength = String(catalog?.strength || '').match(/[\d.]+/)?.[0] || '';
  const dose = String(catalog?.defaultDose || doseFromStrength || '1').trim();
  const unit = String(
    catalog?.defaultDoseUnit ||
      catalog?.strengthUnit ||
      (String(catalog?.dosageForm || '').toLowerCase().includes('tablet') ? 'tablet' : '') ||
      (String(catalog?.dosageForm || '').toLowerCase().includes('capsule') ? 'capsule' : '') ||
      'mg',
  ).trim();
  const route = mapCatalogRouteToSig(catalog?.route);
  const frequency = String(catalog?.defaultFrequency || 'Once daily (QD)').trim();
  const duration = catalog?.defaultDuration
    ? [catalog.defaultDuration, catalog.durationUnit].filter(Boolean).join(' ').trim()
    : 'Ongoing';
  const strength = catalog?.strength
    ? [catalog.strength, catalog.strengthUnit].filter(Boolean).join(' ').trim()
    : null;

  return {
    medicationCatalogId: catalog?.id || null,
    medicationName: order.procedureName || catalog?.name || 'Medication',
    medicationCode: order.procedureCode || catalog?.code || null,
    medicationClass: catalog?.medicationClass || null,
    strength,
    dosageForm: catalog?.dosageForm || null,
    formularyTier: catalog?.formularyTier || null,
    ndcSafetyFlag: catalog?.ndcSafetyFlag || null,
    handlingMethod: 'give_in_clinic',
    dose,
    unit,
    route,
    frequency,
    duration,
    prn: false,
    sigPreview: buildSigPreview({ dose, unit, route, frequency, duration }),
  };
}

async function createMarEntryForOrder(order, user) {
  if (!EMAR_HANDLING_METHODS.includes(order.handlingMethod)) return null;

  const existing = await prisma.medicationMarEntry.findUnique({
    where: { medicationOrderId: order.id },
  });
  if (existing) return existing;

  const startDate = order.signedAt || new Date();
  const endDate = computeEndDate(startDate, order.duration);
  const nextDueAt = computeNextDueAt(order, startDate);

  return prisma.medicationMarEntry.create({
    data: {
      medicationOrderId: order.id,
      patientId: order.patientId,
      appointmentId: order.appointmentId,
      marStatus: nextDueAt && nextDueAt <= new Date() ? 'Due' : 'Pending',
      startDate,
      endDate,
      nextDueAt,
      sampleNdc: order.sampleNdc,
      sampleLotNumber: order.sampleLotNumber,
      sampleQuantity: order.quantity,
    },
  });
}

/**
 * Ensure a Pharmacy chart order has a signed give-in-clinic medication order + MAR entry
 * so it appears on the eMAR tab.
 */
async function ensureEmarFromPharmacyOrder(pharmacyOrder, user = null) {
  if (!pharmacyOrder || !PHARMACY_ORDER_CATEGORIES.includes(pharmacyOrder.category)) {
    return null;
  }
  if (SKIP_PHARMACY_ORDER_STATUSES.includes(pharmacyOrder.status)) {
    return null;
  }

  const appointmentId = pharmacyOrder.appointmentId || null;
  const name = String(pharmacyOrder.procedureName || '').trim();
  const code = String(pharmacyOrder.procedureCode || '').trim();
  if (!name && !code) return null;

  const matchOr = [];
  if (code) matchOr.push({ medicationCode: code });
  if (name) matchOr.push({ medicationName: name });

  let existing = await prisma.medicationOrder.findFirst({
    where: {
      patientId: pharmacyOrder.patientId,
      appointmentId,
      handlingMethod: { in: EMAR_HANDLING_METHODS },
      status: { notIn: ['Cancelled'] },
      OR: matchOr,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!existing) {
    const catalog = await findCatalogForPharmacyOrder(pharmacyOrder);
    const fields = buildMedicationFieldsFromPharmacyOrder(pharmacyOrder, catalog);
    const now = pharmacyOrder.orderDateTime ? new Date(pharmacyOrder.orderDateTime) : new Date();
    const orderedBy = pharmacyOrder.orderedBy || user?.name || user?.email || null;

    existing = await prisma.medicationOrder.create({
      data: {
        patientId: pharmacyOrder.patientId,
        appointmentId,
        ...fields,
        status: 'Signed',
        safetyAcknowledged: true,
        substitutionAllowed: true,
        prescriber: orderedBy,
        orderedBy,
        signedBy: orderedBy,
        signedAt: now,
        createdBy: user?.id || null,
        updatedBy: user?.id || null,
      },
    });
  } else if (existing.status === 'Draft') {
    const orderedBy = pharmacyOrder.orderedBy || existing.orderedBy || user?.name || user?.email || null;
    existing = await prisma.medicationOrder.update({
      where: { id: existing.id },
      data: {
        status: 'Signed',
        signedBy: orderedBy,
        signedAt: existing.signedAt || new Date(),
        updatedBy: user?.id || null,
      },
    });
  }

  await createMarEntryForOrder(existing, user);
  return existing;
}

async function syncPharmacyOrdersToEmar(patientId, appointmentId = null, user = null) {
  const pharmacyOrders = await prisma.order.findMany({
    where: {
      patientId,
      category: { in: PHARMACY_ORDER_CATEGORIES },
      status: { notIn: SKIP_PHARMACY_ORDER_STATUSES },
      ...(appointmentId ? { appointmentId } : {}),
    },
    orderBy: { orderDateTime: 'asc' },
  });

  for (const order of pharmacyOrders) {
    await ensureEmarFromPharmacyOrder(order, user);
  }
}

module.exports = {
  EMAR_HANDLING_METHODS,
  PHARMACY_ORDER_CATEGORIES,
  parseDurationDays,
  computeEndDate,
  computeNextDueAt,
  createMarEntryForOrder,
  ensureEmarFromPharmacyOrder,
  syncPharmacyOrdersToEmar,
};
