const prisma = require('../lib/prisma');

const HIDDEN_STATUSES = ['Cancelled', 'No Show', 'No-Show', 'Deleted', 'Rescheduled'];

const TAB_STATUS_GROUPS = {
  ready_for_intake: ['Scheduled', 'Arrived', 'Checked-In', 'Registration Incomplete', 'Rescheduled'],
  ready_for_providers: ['Roomed', 'Ready for Provider'],
  ready_for_checkout: ['With Provider', 'Provider Out', 'In Progress'],
  ready_for_coding: ['Check out', 'Completed'],
};

const patientSelect = {
  id: true,
  mrn: true,
  firstName: true,
  lastName: true,
  middleName: true,
  gender: true,
  dateOfBirth: true,
  billingType: true,
  consentFormSigned: true,
  assignedToId: true,
  assignedTo: { select: { id: true, name: true } },
  consentSignatures: { select: { consentFormId: true } },
  insurances: { select: { id: true } },
};

const includeRelations = {
  patient: { select: patientSelect },
  providerRef: {
    select: { id: true, firstName: true, lastName: true, middleName: true },
  },
  departmentRef: { select: { id: true, departmentName: true } },
  appointmentTypeRef: { select: { id: true, name: true } },
};

let mandatoryConsentIdsCache = null;
let mandatoryConsentCacheAt = 0;
const CACHE_TTL_MS = 60_000;

async function getMandatoryConsentFormIds() {
  const now = Date.now();
  if (mandatoryConsentIdsCache && now - mandatoryConsentCacheAt < CACHE_TTL_MS) {
    return mandatoryConsentIdsCache;
  }

  const forms = await prisma.consentForm.findMany({
    where: {
      isMandatory: true,
      deletedAt: null,
      status: 'active',
    },
    select: { id: true },
  });

  mandatoryConsentIdsCache = forms.map((f) => f.id);
  mandatoryConsentCacheAt = now;
  return mandatoryConsentIdsCache;
}

function formatProviderName(provider, fallback) {
  if (provider) {
    return [provider.firstName, provider.middleName, provider.lastName].filter(Boolean).join(' ');
  }
  return fallback || null;
}

function formatPatientName(patient) {
  if (!patient) return '';
  return [patient.lastName, [patient.firstName, patient.middleName].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
}

function formatGenderCode(gender) {
  const value = (gender || '').toLowerCase();
  if (value.startsWith('m')) return 'M';
  if (value.startsWith('f')) return 'F';
  if (value) return 'O';
  return '—';
}

function computeWaitingMinutes(appointment) {
  const now = Date.now();
  if (appointment.arrivalTime) {
    return Math.max(0, Math.floor((now - new Date(appointment.arrivalTime).getTime()) / 60000));
  }
  const waitingStatuses = [
    'Arrived',
    'Checked-In',
    'Roomed',
    'With Provider',
    'Provider Out',
    'In Progress',
    'Registration Incomplete',
  ];
  if (!waitingStatuses.includes(appointment.status)) return null;
  const [hours, minutes] = (appointment.appointmentTime || '00:00').split(':').map(Number);
  const base = new Date(appointment.appointmentDate);
  base.setHours(hours || 0, minutes || 0, 0, 0);
  return Math.max(0, Math.floor((now - base.getTime()) / 60000));
}

function serializeRow(appointment) {
  return {
    id: appointment.id,
    encounterNumber: appointment.encounterNumber,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    status: appointment.status,
    department: appointment.departmentRef?.departmentName || appointment.department || null,
    departmentId: appointment.departmentId,
    provider: formatProviderName(appointment.providerRef, appointment.provider),
    providerId: appointment.providerId,
    chiefComplaint: appointment.chiefComplaint || appointment.visitReason || null,
    waitingMinutes: computeWaitingMinutes(appointment),
    checkoutStatus: appointment.checkoutStatus || null,
    patient: {
      id: appointment.patient.id,
      mrn: appointment.patient.mrn,
      firstName: appointment.patient.firstName,
      lastName: appointment.patient.lastName,
      middleName: appointment.patient.middleName,
      displayName: formatPatientName(appointment.patient),
      gender: appointment.patient.gender,
      genderCode: formatGenderCode(appointment.patient.gender),
      dateOfBirth: appointment.patient.dateOfBirth,
      assignedToId: appointment.patient.assignedToId,
      assignedToName: appointment.patient.assignedTo?.name || null,
    },
  };
}

function buildPatientEligibilityConditions(mandatoryIds) {
  const billingEligible = {
    OR: [
      { billingType: 'self_pay' },
      { billingType: 'insurance' },
      { insurances: { some: {} } },
    ],
  };

  const consentConditions = [];
  if (mandatoryIds.length) {
    mandatoryIds.forEach((consentFormId) => {
      consentConditions.push({
        consentSignatures: { some: { consentFormId } },
      });
    });
  } else {
    consentConditions.push({
      OR: [{ consentFormSigned: true }, { consentSignatures: { some: {} } }],
    });
  }

  return {
    deletedAt: null,
    AND: [billingEligible, ...consentConditions],
  };
}

async function buildWhereClause(filters = {}) {
  const {
    search,
    gender,
    departmentId,
    status,
    providerId,
    dateFrom,
    dateTo,
    appointmentTimeFilter,
    tab,
    assignedToId,
  } = filters;

  const mandatoryIds = await getMandatoryConsentFormIds();
  const conditions = [
    { status: { notIn: HIDDEN_STATUSES } },
    { patient: buildPatientEligibilityConditions(mandatoryIds) },
  ];

  if (search) {
    conditions.push({
      OR: [
        { encounterNumber: { contains: search, mode: 'insensitive' } },
        { chiefComplaint: { contains: search, mode: 'insensitive' } },
        { visitReason: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { middleName: { contains: search, mode: 'insensitive' } } },
        { patient: { mrn: { contains: search, mode: 'insensitive' } } },
        { providerRef: { firstName: { contains: search, mode: 'insensitive' } } },
        { providerRef: { lastName: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  if (gender && gender !== 'all') {
    conditions.push({ patient: { gender: { equals: gender, mode: 'insensitive' } } });
  }

  if (departmentId && departmentId !== 'all') {
    conditions.push({ departmentId });
  }

  if (status && status !== 'all') {
    conditions.push({ status });
  }

  if (providerId && providerId !== 'all') {
    conditions.push({ providerId });
  }

  if (dateFrom || dateTo) {
    const range = {};
    if (dateFrom) range.gte = new Date(dateFrom);
    if (dateTo) range.lte = new Date(dateTo);
    conditions.push({ appointmentDate: range });
  }

  if (appointmentTimeFilter === 'morning') {
    conditions.push({ appointmentTime: { lt: '12:00' } });
  } else if (appointmentTimeFilter === 'afternoon') {
    conditions.push({ appointmentTime: { gte: '12:00' } });
  }

  if (tab === 'my_patients' && assignedToId) {
    conditions.push({ patient: { assignedToId } });
  } else if (tab && TAB_STATUS_GROUPS[tab]) {
    conditions.push({ status: { in: TAB_STATUS_GROUPS[tab] } });
  }

  return { AND: conditions };
}

function computeTabCounts(rows, assignedToId) {
  return {
    all: rows.length,
    my_patients: rows.filter((row) => row.patient.assignedToId === assignedToId).length,
    ready_for_intake: rows.filter((row) => TAB_STATUS_GROUPS.ready_for_intake.includes(row.status)).length,
    ready_for_providers: rows.filter((row) => TAB_STATUS_GROUPS.ready_for_providers.includes(row.status)).length,
    ready_for_checkout: rows.filter((row) => TAB_STATUS_GROUPS.ready_for_checkout.includes(row.status)).length,
    ready_for_coding: rows.filter((row) => TAB_STATUS_GROUPS.ready_for_coding.includes(row.status)).length,
  };
}

const encountersWorkListService = {
  async findAll(filters = {}) {
    const { page = 1, limit = 25, assignedToId } = filters;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = await buildWhereClause(filters);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: parseInt(limit, 10) || 25,
        orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'asc' }],
        include: includeRelations,
      }),
      prisma.appointment.count({ where }),
    ]);

    const allRows = await prisma.appointment.findMany({
      where: await buildWhereClause({ ...filters, tab: undefined, page: undefined, limit: undefined }),
      include: includeRelations,
    });
    const serializedAll = allRows.map(serializeRow);
    const tabCounts = computeTabCounts(serializedAll, assignedToId);

    return {
      data: appointments.map(serializeRow),
      tabCounts,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  },
};

module.exports = encountersWorkListService;
