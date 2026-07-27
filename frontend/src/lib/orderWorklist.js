/** Helpers to map encounter Order API rows into department worklist shapes. */

export function calcAge(dob) {
  if (!dob) return '-';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Age for display: months (e.g. "1 month", "1.3 months") when under 1 year, otherwise years. */
export function formatAgeDisplay(dob) {
  if (!dob) return '-';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '-';
  const today = new Date();
  if (birth > today) return '-';

  const years = calcAge(dob);
  if (years === '-') return '-';
  if (years >= 1) return `${years} yrs`;

  const msPerDay = 1000 * 60 * 60 * 24;
  const days = (today.getTime() - birth.getTime()) / msPerDay;
  const monthsExact = days / 30.437;
  const months = Math.round(monthsExact * 10) / 10;
  if (months <= 0) return '0 months';
  if (months === 1) return '1 month';
  return `${months} months`;
}

export function formatPatientName(patient) {
  if (!patient) return '-';
  if (patient.name) return patient.name;
  const parts = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : '-';
}

export function formatDob(dob) {
  if (!dob) return '-';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return String(dob);
  return d.toLocaleDateString('en-US');
}

export function formatGender(gender) {
  if (!gender) return '-';
  const g = String(gender).toLowerCase();
  if (g === 'm' || g === 'male') return 'Male';
  if (g === 'f' || g === 'female') return 'Female';
  return gender;
}

/** Map order status → specimen collection status for lab worklist UI. */
export function orderStatusToSpecimenStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'scheduled' || s === 'pending') return 'Pending';
  if (s === 'in progress' || s === 'submitted') return 'Submitted';
  if (s === 'collected') return 'Collected';
  if (s === 'resulted' || s === 'completed') return 'Completed';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  return status || 'Pending';
}

/** Map specimen UI status → order status for PATCH /orders/:id/status. */
export function specimenStatusToOrderStatus(specimenStatus) {
  const s = String(specimenStatus || '').toLowerCase();
  if (s === 'pending') return 'Pending';
  if (s === 'submitted') return 'In Progress';
  if (s === 'collected') return 'Collected';
  if (s === 'completed') return 'Resulted';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  return specimenStatus || 'Pending';
}

export function normalizePatientFromOrder(order) {
  const p = order?.patient || {};
  const dob = p.dateOfBirth || p.dob || null;
  return {
    id: order.patientId || p.id,
    name: formatPatientName(p),
    mrn: p.mrn || '-',
    dob: formatDob(dob),
    dateOfBirth: dob,
    age: calcAge(dob),
    gender: formatGender(p.gender),
    genderRaw: p.gender || '',
  };
}

/** Lab specimen-collection row shape from Order (category Lab). */
export function mapOrderToLabRow(order) {
  const patient = normalizePatientFromOrder(order);
  return {
    id: order.id,
    patientId: order.patientId,
    testId: order.procedureCode || order.id?.slice(0, 8),
    testName: order.procedureName || '-',
    procedureCode: order.procedureCode,
    procedureName: order.procedureName,
    category: order.category,
    status: order.status,
    specimenStatus: orderStatusToSpecimenStatus(order.status),
    resultStatus: order.status === 'Resulted' ? 'Resulted' : 'Ordered',
    destination: order.destination,
    orderedBy: order.orderedBy,
    createdBy: order.orderedBy || '-',
    department: order.category || 'Lab',
    createdAt: order.orderDateTime || order.createdAt,
    orderDateTime: order.orderDateTime || order.createdAt,
    updatedAt: order.updatedAt,
    collectionSite: order.collectionSite || order.site || '',
    specimenType: order.specimenType || '',
    collectedBy: order.collectedBy || '',
    collectionDateTime: order.collectionDateTime || null,
    collectionNotes: order.collectionNotes || '',
    patient,
    source: 'order',
  };
}

/** Radiology order-management row shape from Order (category Radiology). */
export function mapOrderToRadiologyRow(order) {
  const patient = normalizePatientFromOrder(order);
  return {
    id: order.id,
    patientId: order.patientId,
    orderName: order.procedureName || '-',
    procedureCode: order.procedureCode,
    procedureName: order.procedureName,
    status: order.status || 'Scheduled',
    orderDateTime: order.orderDateTime || order.createdAt,
    lastUpdatedAt: order.updatedAt || order.orderDateTime || order.createdAt,
    lastUpdatedBy: order.orderedBy || '-',
    orderedBy: order.orderedBy,
    destination: order.destination,
    patient,
    source: 'order',
  };
}

/** Pharmacy e-prescribe row / medication card shape from Order (category Pharmacy). */
export function mapOrderToPharmacyMed(order) {
  const patient = normalizePatientFromOrder(order);
  return {
    id: order.id,
    patientId: order.patientId,
    medicationName: order.procedureName || '-',
    drugProduct: order.procedureCode || '-',
    dosage: '-',
    description: order.procedureName || '-',
    comment: '',
    priority: 'Routine',
    status: order.status || 'Order',
    dateTime: order.orderDateTime || order.createdAt,
    createdBy: order.orderedBy || '-',
    orderedBy: order.orderedBy,
    updatedAt: order.updatedAt || order.orderDateTime || order.createdAt,
    patient,
    source: 'order',
  };
}

/**
 * Group order rows by patientId into worklist listing rows.
 * @param {Array} rows - mapped lab/radiology/pharmacy rows with patientId + patient
 * @param {'createdAt'|'orderDateTime'|'updatedAt'|'dateTime'} dateField
 */
export function groupOrdersByPatient(rows, dateField = 'createdAt') {
  const byPatient = new Map();
  for (const row of rows) {
    const pid = row.patientId;
    if (!pid) continue;
    if (!byPatient.has(pid)) {
      byPatient.set(pid, {
        patientId: pid,
        id: pid,
        patient: row.patient,
        name: row.patient?.name,
        mrn: row.patient?.mrn,
        dob: row.patient?.dob,
        age: row.patient?.age,
        gender: row.patient?.gender,
        orders: [],
        tests: [],
        medications: [],
      });
    }
    const g = byPatient.get(pid);
    g.orders.push(row);
    g.tests.push(row);
    g.medications.push(row);
  }

  return Array.from(byPatient.values()).map((g) => {
    const dates = g.orders
      .map((o) => o[dateField] || o.createdAt || o.orderDateTime || o.updatedAt || o.dateTime)
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((n) => !Number.isNaN(n));
    const lastUpdated = dates.length ? new Date(Math.max(...dates)).toISOString() : null;
    const createdAt = dates.length ? new Date(Math.min(...dates)).toISOString() : null;
    return {
      ...g,
      totalOrders: g.orders.length,
      medicationCount: g.orders.length,
      lastUpdated,
      createdAt,
      updatedBy: g.orders[0]?.orderedBy || g.orders[0]?.createdBy || '-',
      admission: null,
    };
  });
}

export const OPEN_LAB_ORDER_STATUSES = new Set([
  'Scheduled',
  'Pending',
  'In Progress',
  'Submitted',
  'Collected',
  'Cancelled',
]);

export const OPEN_RADIOLOGY_ORDER_STATUSES = new Set([
  'Scheduled',
  'Pending',
  'In Progress',
]);

export const OPEN_PHARMACY_ORDER_STATUSES = new Set([
  'Scheduled',
  'Pending',
  'In Progress',
  'Order',
  'Dispatch',
]);

/** Outside lab display status from order status. */
export function orderStatusToOutsideLabStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'resulted' || s === 'completed' || s === 'received report') return 'Received report';
  return 'Send out';
}

/** Map outside-lab UI status → order status. */
export function outsideLabStatusToOrderStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'received report') return 'Resulted';
  return 'Pending';
}

export function mapOrderToOutsideLabRow(order) {
  const base = mapOrderToLabRow(order);
  return {
    ...base,
    orderStatus: orderStatusToOutsideLabStatus(order.status),
    orderCreatedAt: order.orderDateTime || order.createdAt,
    orderUpdatedAt: order.updatedAt || order.orderDateTime || order.createdAt,
  };
}
