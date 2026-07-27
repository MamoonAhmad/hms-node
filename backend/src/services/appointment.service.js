const prisma = require('../lib/prisma');
const appointmentStatusService = require('./appointmentStatus.service');
const appointmentAvailabilityService = require('./appointmentAvailability.service');
const {
  ENCOUNTER_VISIT_STATUS,
  shouldAdvanceStatus,
  APPOINTMENT_STATUS,
  normalizeAppointmentStatus,
  resolveAutomaticStatus,
  statusMatchValues,
  canTransition,
} = require('../utils/encounterVisitStatus');

const HIDDEN_TIMELINE_STATUSES = [
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.NO_SHOW,
  'No-Show',
  APPOINTMENT_STATUS.LWBS,
  'Deleted',
];

const EVENT_STATUS = {
  SCHEDULED: 'Scheduled',
  CHECKED_IN: 'Checked In',
  ROOMED: 'Roomed',
  CONSENT_NOT_SIGNED: 'Consent Form Not Signed',
  REGISTRATION_COMPLETE: 'Registration Complete',
};

const FIELD_LABELS = {
  patientId: 'Patient',
  appointmentDate: 'Appointment Date',
  appointmentTime: 'Appointment Time',
  appointmentEndTime: 'Appointment End Time',
  duration: 'Duration',
  appointmentType: 'Appointment Type',
  appointmentTypeId: 'Appointment Type',
  visitReason: 'Reason for Visit',
  visitModality: 'Visit Type',
  department: 'Department',
  departmentId: 'Department',
  provider: 'Provider',
  providerId: 'Provider',
  status: 'Appointment Status',
  eventStatus: 'Event Status',
  roomId: 'Room',
  notes: 'Appointment Notes',
  accessibilityRequirements: 'Accessibility Requirements',
  accessibilityRequirementsNotes: 'Accessibility Notes',
};

const patientSelect = {
  id: true,
  mrn: true,
  firstName: true,
  lastName: true,
  middleName: true,
  dateOfBirth: true,
  gender: true,
  genderIdentity: true,
  contactNumber: true,
  cellPhone: true,
  homePhone: true,
  email: true,
  address: true,
  addressLine2: true,
  city: true,
  state: true,
  zip: true,
  profilePhoto: true,
  assignedToId: true,
  billingType: true,
  insuranceProvider: true,
  consentFormSigned: true,
  insurances: {
    select: {
      id: true,
      insuranceType: true,
      memberId: true,
      planName: true,
      insuranceProvider: {
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: { insuranceType: 'asc' },
  },
  consentSignatures: {
    select: { id: true, consentFormId: true, signedAt: true },
  },
};

const providerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  middleName: true,
  npi: true,
  specialty: { select: { id: true, name: true, code: true } },
  subSpecialty: { select: { id: true, name: true, code: true } },
};

const includeRelations = {
  patient: { select: patientSelect },
  providerRef: { select: providerSelect },
  departmentRef: { select: { id: true, departmentName: true } },
  appointmentTypeRef: { select: { id: true, name: true } },
  roomRef: { select: { id: true, roomNumber: true, displayName: true, floor: true, unit: true } },
};

/** Lightweight milestone rows for Wait Time / TLOS on tracking boards. */
const timingInclude = {
  history: {
    where: {
      action: {
        in: [
          'check_in',
          'rooming',
          'checkout_completed',
          'updated',
          'registration_status',
          'created',
        ],
      },
    },
    select: { action: true, createdAt: true, changes: true },
    orderBy: { createdAt: 'asc' },
  },
  checkout: {
    select: { completedAt: true, status: true },
  },
};

const includeRelationsWithTiming = {
  ...includeRelations,
  ...timingInclude,
};

function toDateOrNull(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toIsoOrNull(value) {
  const date = toDateOrNull(value);
  return date ? date.toISOString() : null;
}

function normalizeTimingLabel(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
}

function isCheckedInLabel(value) {
  const n = normalizeTimingLabel(value);
  return n === 'checked in' || n === 'arrived';
}

function isRoomedLabel(value) {
  return normalizeTimingLabel(value) === 'roomed';
}

function isCheckedOutLabel(value) {
  const n = normalizeTimingLabel(value);
  return n === 'checked out' || n === 'completed' || n === 'checkout';
}

function isVisitStartedStatus(status, eventStatus) {
  const s = normalizeTimingLabel(status);
  const e = normalizeTimingLabel(eventStatus);
  if (isCheckedInLabel(s) || isCheckedInLabel(e)) return true;
  if (isRoomedLabel(e)) return true;
  if (isCheckedOutLabel(s)) return true;
  return [
    'in progress',
    'in intake',
    'with provider',
    'provider out',
    'ready for checkout',
  ].includes(s);
}

function combineAppointmentDateTime(appointmentDate, appointmentTime) {
  const date = toDateOrNull(appointmentDate);
  if (!date) return null;
  const time = String(appointmentTime || '00:00').trim();
  const match = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  const hours = match ? Number(match[1]) : 0;
  const minutes = match ? Number(match[2]) : 0;
  const seconds = match ? Number(match[3] || 0) : 0;
  // Date-only values arrive as UTC midnight; build local clinic datetime.
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hours,
    minutes,
    seconds,
    0,
  );
}

function historyChangeTo(entry, field) {
  const changes = Array.isArray(entry?.changes) ? entry.changes : [];
  const hit = changes.find((c) => c?.field === field);
  return hit?.to ?? null;
}

function earliestDate(dates) {
  const valid = dates.map(toDateOrNull).filter(Boolean);
  if (!valid.length) return null;
  return new Date(Math.min(...valid.map((d) => d.getTime())));
}

function extractVisitTiming(appointment) {
  const history = Array.isArray(appointment?.history) ? appointment.history : [];

  let checkedInAt =
    history.find((h) => h.action === 'check_in')?.createdAt || null;
  let roomedAt = history.find((h) => h.action === 'rooming')?.createdAt || null;
  let checkedOutAt =
    appointment?.checkout?.completedAt ||
    [...history].reverse().find((h) => h.action === 'checkout_completed')?.createdAt ||
    null;

  for (const entry of history) {
    const statusTo = historyChangeTo(entry, 'status');
    const eventTo = historyChangeTo(entry, 'eventStatus');

    if (!checkedInAt && (isCheckedInLabel(statusTo) || isCheckedInLabel(eventTo))) {
      checkedInAt = entry.createdAt;
    }
    if (!roomedAt && isRoomedLabel(eventTo)) {
      roomedAt = entry.createdAt;
    }
    if (!checkedOutAt && isCheckedOutLabel(statusTo)) {
      checkedOutAt = entry.createdAt;
    }
  }

  const appointmentStart = combineAppointmentDateTime(
    appointment?.appointmentDate,
    appointment?.appointmentTime,
  );
  const endCap = toDateOrNull(checkedOutAt) || new Date();

  // Many encounters never logged a dedicated check_in action — infer arrival.
  if (!checkedInAt) {
    const started =
      isVisitStartedStatus(appointment?.status, appointment?.eventStatus) ||
      Boolean(roomedAt) ||
      Boolean(checkedOutAt) ||
      Boolean(appointment?.roomId);

    if (started) {
      const candidates = [
        roomedAt,
        appointment?.createdAt,
        appointmentStart && appointmentStart.getTime() <= endCap.getTime()
          ? appointmentStart
          : null,
      ];
      checkedInAt = earliestDate(candidates);
    }
  }

  // Roomed without a rooming history row.
  if (!roomedAt && (isRoomedLabel(appointment?.eventStatus) || appointment?.roomId)) {
    roomedAt = checkedInAt;
  }

  // Guard reopened visits where a later check_in is after checkout.
  const checkedInDate = toDateOrNull(checkedInAt);
  let checkedOutDate = toDateOrNull(checkedOutAt);
  if (checkedInDate && checkedOutDate && checkedInDate.getTime() > checkedOutDate.getTime()) {
    const priorStart = earliestDate([
      appointment?.createdAt,
      appointmentStart && appointmentStart.getTime() <= checkedOutDate.getTime()
        ? appointmentStart
        : null,
      roomedAt && toDateOrNull(roomedAt)?.getTime() <= checkedOutDate.getTime() ? roomedAt : null,
    ]);
    checkedInAt = priorStart || checkedOutAt;
  }

  // Completed/checked-out without a checkout row — freeze TLOS at last update.
  if (!checkedOutAt && isCheckedOutLabel(appointment?.status)) {
    checkedOutAt = appointment?.updatedAt || null;
    checkedOutDate = toDateOrNull(checkedOutAt);
  }

  return {
    checkedInAt: toIsoOrNull(checkedInAt),
    roomedAt: toIsoOrNull(roomedAt),
    checkedOutAt: toIsoOrNull(checkedOutAt),
  };
}

function serializeAppointment(appointment) {
  if (!appointment) return appointment;
  let accessibilityRequirements = appointment.accessibilityRequirements;
  if (typeof accessibilityRequirements === 'string') {
    try {
      accessibilityRequirements = JSON.parse(accessibilityRequirements);
    } catch {
      accessibilityRequirements = [];
    }
  }
  const { history, checkout, ...rest } = appointment;
  const visitTiming = extractVisitTiming(appointment);
  return {
    ...rest,
    status: normalizeAppointmentStatus(appointment.status),
    appointmentType: appointment.appointmentTypeRef?.name || null,
    accessibilityRequirements: Array.isArray(accessibilityRequirements) ? accessibilityRequirements : [],
    room: appointment.roomRef
      ? {
          id: appointment.roomRef.id,
          roomNumber: appointment.roomRef.roomNumber,
          displayName: appointment.roomRef.displayName,
          floor: appointment.roomRef.floor,
          unit: appointment.roomRef.unit,
        }
      : null,
    visitTiming,
  };
}

function formatProviderName(provider) {
  if (!provider) return null;
  const parts = [provider.firstName, provider.middleName, provider.lastName].filter(Boolean);
  return parts.join(' ') || null;
}

function serializeAccessibilityRequirements(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value.length ? JSON.stringify(value) : null;
  if (typeof value === 'string') return value.trim() || null;
  return null;
}

function parseAccessibilityRequirements(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function generateEncounterNumber() {
  const prefix = `ENC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const encounterNumber = `${prefix}-${suffix}`;
    const existing = await prisma.appointment.findUnique({ where: { encounterNumber } });
    if (!existing) return encounterNumber;
  }
  return `ENC-${Date.now()}`;
}

function buildWhereClause(filters = {}) {
  const {
    search,
    status,
    appointmentType,
    department,
    departmentId,
    provider,
    providerId,
    date,
    dateFrom,
    dateTo,
    patientId,
    excludeHiddenTimeline,
  } = filters;

  const conditions = [];

  if (search) {
    conditions.push({
      OR: [
        { visitReason: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
        { encounterNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { mrn: { contains: search, mode: 'insensitive' } } },
        { providerRef: { firstName: { contains: search, mode: 'insensitive' } } },
        { providerRef: { lastName: { contains: search, mode: 'insensitive' } } },
        { providerRef: { npi: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  if (status) {
    const matchValues = statusMatchValues(status);
    conditions.push(
      matchValues.length === 1 ? { status: matchValues[0] } : { status: { in: matchValues } },
    );
  }
  if (appointmentType) {
    conditions.push({
      appointmentTypeRef: { name: { equals: appointmentType, mode: 'insensitive' } },
    });
  }
  if (departmentId) conditions.push({ departmentId });
  else if (department) conditions.push({ department: { contains: department, mode: 'insensitive' } });
  if (providerId) conditions.push({ providerId });
  else if (provider) conditions.push({ provider: { contains: provider, mode: 'insensitive' } });
  if (patientId) conditions.push({ patientId });

  if (date) {
    conditions.push({ appointmentDate: new Date(date) });
  } else if (dateFrom || dateTo) {
    const range = {};
    if (dateFrom) range.gte = new Date(dateFrom);
    if (dateTo) range.lte = new Date(dateTo);
    conditions.push({ appointmentDate: range });
  }

  if (excludeHiddenTimeline) {
    conditions.push({ status: { notIn: HIDDEN_TIMELINE_STATUSES } });
  }

  return conditions.length ? { AND: conditions } : {};
}

async function resolveProviderFields(data) {
  if (!data.providerId) return { provider: data.provider || null, providerId: null };
  const provider = await prisma.provider.findUnique({ where: { id: data.providerId } });
  if (!provider) {
    const err = new Error('Provider not found');
    err.statusCode = 400;
    throw err;
  }
  return { providerId: provider.id, provider: formatProviderName(provider) };
}

async function resolveDepartmentFields(data) {
  if (!data.departmentId) return { department: data.department || null, departmentId: null };
  const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
  if (!department) {
    const err = new Error('Department not found');
    err.statusCode = 400;
    throw err;
  }
  return { departmentId: department.id, department: department.departmentName };
}

async function resolveAppointmentType(nameOrId) {
  if (!nameOrId) {
    const err = new Error('Appointment type is required');
    err.statusCode = 400;
    throw err;
  }

  const byId = await prisma.appointmentType.findFirst({
    where: { id: nameOrId, deletedAt: null, isActive: true },
  });
  if (byId) return byId;

  const byName = await prisma.appointmentType.findFirst({
    where: {
      name: { equals: String(nameOrId).trim(), mode: 'insensitive' },
      deletedAt: null,
      isActive: true,
    },
  });
  if (byName) return byName;

  const err = new Error('Appointment type not found');
  err.statusCode = 400;
  throw err;
}

async function resolveAppointmentTypeId(nameOrId) {
  const row = await resolveAppointmentType(nameOrId);
  return row.id;
}

function minutesToHhMm(totalMinutes) {
  const mins = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeStringToMinutes(t) {
  const [h, m] = String(t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Resolve booking duration + end time.
 * Non-General types use AppointmentType.defaultTime unless an explicit end time is provided.
 */
function resolveBookingDurationFields(data, appointmentTypeRow) {
  const typeName = appointmentTypeRow?.name || '';
  const isGeneral = String(typeName).trim().toLowerCase() === 'general';
  const typeDuration = Number(appointmentTypeRow?.defaultTime);
  const hasTypeDuration = Number.isFinite(typeDuration) && typeDuration >= 5;

  if (isGeneral) {
    const duration = data.duration || 30;
    return {
      duration,
      appointmentEndTime: data.appointmentEndTime || null,
    };
  }

  const duration =
    data.duration && Number(data.duration) >= 5
      ? parseInt(data.duration, 10)
      : hasTypeDuration
        ? Math.round(typeDuration)
        : 30;

  let appointmentEndTime = data.appointmentEndTime || null;
  if (!appointmentEndTime && data.appointmentTime) {
    appointmentEndTime = minutesToHhMm(timeStringToMinutes(data.appointmentTime) + duration);
  }

  return { duration, appointmentEndTime };
}

function diffFields(before, after, keys) {
  const changes = [];
  keys.forEach((key) => {
    const oldVal = before?.[key];
    const newVal = after?.[key];
    const oldStr = oldVal instanceof Date ? oldVal.toISOString().split('T')[0] : oldVal ?? null;
    const newStr = newVal instanceof Date ? newVal.toISOString().split('T')[0] : newVal ?? null;
    if (String(oldStr ?? '') !== String(newStr ?? '')) {
      changes.push({
        field: key,
        label: FIELD_LABELS[key] || key,
        from: oldStr,
        to: newStr,
      });
    }
  });
  return changes;
}

function userDisplayName(user) {
  return user?.name || user?.email || 'System';
}

async function recordHistory(appointmentId, { action, summary, changes, userId, userName, userRole }) {
  return prisma.appointmentHistory.create({
    data: {
      appointmentId,
      action,
      summary,
      changes: changes?.length ? changes : undefined,
      changedBy: userId || null,
      changedByName: userName || null,
      changedByRole: userRole || null,
    },
  });
}

async function getPatientDisplayName(patientId) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { firstName: true, lastName: true },
  });
  if (!patient) return 'Unknown patient';
  return `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
}

async function getRoomDisplayName(roomId) {
  const room = await prisma.room.findFirst({
    where: { id: roomId, deletedAt: null },
    select: { roomNumber: true, displayName: true },
  });
  if (!room) return 'Unknown room';
  return room.displayName || room.roomNumber;
}

async function hasValidConsentWithin12Months(patientId) {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const recentSignature = await prisma.patientConsentSignature.findFirst({
    where: {
      patientId,
      signedAt: { gte: twelveMonthsAgo },
    },
    orderBy: { signedAt: 'desc' },
  });

  if (recentSignature) return true;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { consentFormSigned: true },
  });

  return Boolean(patient?.consentFormSigned);
}

async function deriveRegistrationEventStatus(patientId) {
  const validConsent = await hasValidConsentWithin12Months(patientId);
  return validConsent ? EVENT_STATUS.REGISTRATION_COMPLETE : EVENT_STATUS.CONSENT_NOT_SIGNED;
}

function applyAppointmentPayloadFields(data) {
  const payload = {};
  if (data.visitModality !== undefined) payload.visitModality = data.visitModality || 'in-house';
  if (data.accessibilityRequirements !== undefined) {
    payload.accessibilityRequirements = serializeAccessibilityRequirements(data.accessibilityRequirements);
  }
  if (data.accessibilityRequirementsNotes !== undefined) {
    payload.accessibilityRequirementsNotes = data.accessibilityRequirementsNotes?.trim() || null;
  }
  return payload;
}

const appointmentService = {
  EVENT_STATUS,

  async create(data, user) {
    const status = await appointmentStatusService.assertActiveStatusName(
      normalizeAppointmentStatus(data.status || APPOINTMENT_STATUS.SCHEDULED),
    );
    const providerFields = await resolveProviderFields(data);
    const departmentFields = await resolveDepartmentFields(data);
    const appointmentTypeRow = await resolveAppointmentType(
      data.appointmentTypeId || data.appointmentType,
    );
    const appointmentTypeId = appointmentTypeRow.id;
    const { duration: bookingDuration, appointmentEndTime: bookingEndTime } =
      resolveBookingDurationFields(data, appointmentTypeRow);

    await appointmentAvailabilityService.assertBookingAllowed({
      providerId: providerFields.providerId,
      departmentId: departmentFields.departmentId,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      appointmentEndTime: bookingEndTime,
      duration: bookingDuration,
      appointmentType: appointmentTypeRow.name,
    });

    const encounterNumber = await generateEncounterNumber();
    const patientName = await getPatientDisplayName(data.patientId);

    const appointment = await prisma.appointment.create({
      data: {
        encounterNumber,
        appointmentDate: new Date(data.appointmentDate),
        appointmentTime: data.appointmentTime,
        appointmentEndTime: bookingEndTime,
        duration: bookingDuration,
        appointmentTypeId,
        visitReason: data.visitReason,
        ...departmentFields,
        ...providerFields,
        status,
        eventStatus: EVENT_STATUS.SCHEDULED,
        notes: data.notes,
        patientId: data.patientId,
        createdBy: user?.id || null,
        updatedBy: user?.id || null,
        ...applyAppointmentPayloadFields(data),
      },
      include: includeRelations,
    });

    await recordHistory(appointment.id, {
      action: 'created',
      summary: 'Appointment Created',
      changes: [
        { field: 'createdAt', label: 'Created Date and Time', to: appointment.createdAt },
        { field: 'createdBy', label: 'Created User Name', to: userDisplayName(user) },
        { field: 'createdByRole', label: 'Created User Role', to: user?.role || '—' },
        { field: 'patientId', label: 'Created For', to: patientName },
        { field: 'eventStatus', label: 'Event Status', to: EVENT_STATUS.SCHEDULED },
      ],
      userId: user?.id,
      userName: userDisplayName(user),
      userRole: user?.role,
    });

    if (data.evaluateRegistrationStatus) {
      const registrationEventStatus = await deriveRegistrationEventStatus(data.patientId);
      if (registrationEventStatus !== EVENT_STATUS.SCHEDULED) {
        const updated = await prisma.appointment.update({
          where: { id: appointment.id },
          data: { eventStatus: registrationEventStatus },
          include: includeRelations,
        });

        await recordHistory(appointment.id, {
          action: 'registration_status',
          summary: 'Registration Status Update',
          changes: [
            {
              field: 'eventStatus',
              label: 'Registration Status',
              from: EVENT_STATUS.SCHEDULED,
              to: registrationEventStatus,
            },
          ],
          userId: user?.id,
          userName: userDisplayName(user),
          userRole: user?.role,
        });

        return serializeAppointment(updated);
      }
    }

    return serializeAppointment(appointment);
  },

  async findAll(filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const skip = (page - 1) * parseInt(limit, 10);
    const where = buildWhereClause(filters);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: parseInt(limit, 10) || 10,
        orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
        include: includeRelationsWithTiming,
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments.map(serializeAppointment),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  },

  async getStatusCounts(filters = {}) {
    const where = buildWhereClause({ ...filters, status: undefined });
    const grouped = await prisma.appointment.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });

    const counts = { all: 0 };
    grouped.forEach((row) => {
      const key = normalizeAppointmentStatus(row.status);
      counts[key] = (counts[key] || 0) + row._count._all;
      counts.all += row._count._all;
    });

    return counts;
  },

  async findById(id) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: includeRelations,
    });
    return serializeAppointment(appointment);
  },

  async findByPatientId(patientId) {
    const rows = await prisma.appointment.findMany({
      where: { patientId },
      orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'desc' }],
      include: includeRelations,
    });
    return rows.map(serializeAppointment);
  },

  async getHistory(id) {
    return prisma.appointmentHistory.findMany({
      where: { appointmentId: id },
      orderBy: { createdAt: 'asc' },
    });
  },

  async checkIn(id, user) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return null;

    const previousEventStatus = existing.eventStatus;
    await prisma.appointment.update({
      where: { id },
      data: {
        eventStatus: EVENT_STATUS.CHECKED_IN,
        updatedBy: user?.id || existing.updatedBy,
      },
    });

    const nextStatus = resolveAutomaticStatus(existing.status, 'check_in');
    let statusUpdated = false;
    if (nextStatus) {
      try {
        await appointmentStatusService.assertActiveStatusName(nextStatus);
        await prisma.appointment.update({
          where: { id },
          data: { status: nextStatus },
        });
        statusUpdated = true;
      } catch {
        // Canonical status may not exist in catalog yet
      }
    }

    const changes = [
      {
        field: 'eventStatus',
        label: 'Event Status',
        from: previousEventStatus,
        to: EVENT_STATUS.CHECKED_IN,
      },
    ];
    if (statusUpdated) {
      changes.push({
        field: 'status',
        label: 'Appointment Status',
        from: existing.status,
        to: nextStatus,
      });
    }

    await recordHistory(id, {
      action: 'check_in',
      summary: 'Check-In Update',
      changes,
      userId: user?.id,
      userName: userDisplayName(user),
      userRole: user?.role,
    });

    return serializeAppointment(
      await prisma.appointment.findUnique({ where: { id }, include: includeRelationsWithTiming }),
    );
  },

  async assignRoom(id, roomId, user) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return null;

    const room = await prisma.room.findFirst({
      where: { id: roomId, deletedAt: null, status: 'active' },
    });
    if (!room) {
      const err = new Error('Room not found or inactive');
      err.statusCode = 400;
      throw err;
    }

    const previousRoomId = existing.roomId;
    const previousEventStatus = existing.eventStatus;
    const roomLabel = room.displayName || room.roomNumber;

    const nextVisitStatus =
      resolveAutomaticStatus(existing.status, 'start_encounter') ||
      (shouldAdvanceStatus(existing.status, ENCOUNTER_VISIT_STATUS.IN_PROGRESS)
        ? ENCOUNTER_VISIT_STATUS.IN_PROGRESS
        : null);

    await prisma.appointment.update({
      where: { id },
      data: {
        roomId: room.id,
        eventStatus: EVENT_STATUS.ROOMED,
        ...(nextVisitStatus ? { status: nextVisitStatus } : {}),
        updatedBy: user?.id || existing.updatedBy,
      },
    });

    const changes = [
      {
        field: 'roomId',
        label: 'Room Assignment',
        from: previousRoomId ? await getRoomDisplayName(previousRoomId) : '—',
        to: roomLabel,
      },
      {
        field: 'eventStatus',
        label: 'Event Status',
        from: previousEventStatus,
        to: EVENT_STATUS.ROOMED,
      },
    ];
    if (nextVisitStatus) {
      changes.push({
        field: 'status',
        label: 'Appointment Status',
        from: existing.status,
        to: nextVisitStatus,
      });
    }

    await recordHistory(id, {
      action: 'rooming',
      summary: 'Rooming Update',
      changes,
      userId: user?.id,
      userName: userDisplayName(user),
      userRole: user?.role,
    });

    return serializeAppointment(
      await prisma.appointment.findUnique({ where: { id }, include: includeRelationsWithTiming }),
    );
  },

  async evaluateRegistrationEventStatus(id, user) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return null;

    const nextStatus = await deriveRegistrationEventStatus(existing.patientId);
    if (existing.eventStatus === nextStatus) {
      return serializeAppointment(
        await prisma.appointment.findUnique({ where: { id }, include: includeRelations }),
      );
    }

    const protectedStatuses = [EVENT_STATUS.CHECKED_IN, EVENT_STATUS.ROOMED];
    if (protectedStatuses.includes(existing.eventStatus)) {
      return serializeAppointment(
        await prisma.appointment.findUnique({ where: { id }, include: includeRelations }),
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { eventStatus: nextStatus },
      include: includeRelations,
    });

    await recordHistory(id, {
      action: 'registration_status',
      summary: 'Registration Status Update',
      changes: [
        {
          field: 'eventStatus',
          label: 'Registration Status',
          from: existing.eventStatus,
          to: nextStatus,
        },
      ],
      userId: user?.id,
      userName: userDisplayName(user),
      userRole: user?.role,
    });

    return serializeAppointment(appointment);
  },

  async update(id, data, user) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return null;

    const updateData = {
      ...applyAppointmentPayloadFields(data),
      updatedBy: user?.id || existing.updatedBy,
    };

    if (data.patientId !== undefined) updateData.patientId = data.patientId;
    if (data.appointmentDate) updateData.appointmentDate = new Date(data.appointmentDate);
    if (data.appointmentTime !== undefined) updateData.appointmentTime = data.appointmentTime;
    if (data.appointmentEndTime !== undefined) {
      updateData.appointmentEndTime = data.appointmentEndTime || null;
    }
    if (data.visitReason !== undefined) updateData.visitReason = data.visitReason;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.status !== undefined) {
      const currentStatus = normalizeAppointmentStatus(existing.status);
      const requested = normalizeAppointmentStatus(data.status);
      const allowed =
        requested === currentStatus ||
        canTransition(currentStatus, requested) ||
        shouldAdvanceStatus(currentStatus, requested);
      if (!allowed) {
        const err = new Error(
          `Cannot change appointment status from "${currentStatus}" to "${requested}"`,
        );
        err.statusCode = 400;
        throw err;
      }
      updateData.status = await appointmentStatusService.assertActiveStatusName(requested);
    }
    if (data.duration !== undefined && data.duration !== null) {
      updateData.duration = parseInt(data.duration, 10);
    }

    if (data.providerId !== undefined) {
      Object.assign(updateData, await resolveProviderFields(data));
    }
    if (data.departmentId !== undefined) {
      Object.assign(updateData, await resolveDepartmentFields(data));
    }
    let appointmentTypeRow = null;
    if (data.appointmentType !== undefined || data.appointmentTypeId !== undefined) {
      appointmentTypeRow = await resolveAppointmentType(
        data.appointmentTypeId || data.appointmentType,
      );
      updateData.appointmentTypeId = appointmentTypeRow.id;
    } else if (existing.appointmentTypeId) {
      appointmentTypeRow = await prisma.appointmentType.findFirst({
        where: { id: existing.appointmentTypeId, deletedAt: null },
      });
    }

    if (
      appointmentTypeRow &&
      (data.appointmentTime !== undefined ||
        data.appointmentDate !== undefined ||
        data.appointmentType !== undefined ||
        data.appointmentTypeId !== undefined ||
        data.duration !== undefined)
    ) {
      const resolved = resolveBookingDurationFields(
        {
          appointmentTime: data.appointmentTime ?? existing.appointmentTime,
          appointmentEndTime:
            data.appointmentEndTime !== undefined
              ? data.appointmentEndTime
              : existing.appointmentEndTime,
          duration: data.duration,
        },
        appointmentTypeRow,
      );
      if (data.duration === undefined) updateData.duration = resolved.duration;
      if (data.appointmentEndTime === undefined) {
        updateData.appointmentEndTime = resolved.appointmentEndTime;
      }
    }

    const providerId = updateData.providerId ?? existing.providerId;
    const appointmentDate = updateData.appointmentDate ?? existing.appointmentDate;
    const appointmentTime = updateData.appointmentTime ?? existing.appointmentTime;
    const appointmentEndTime = updateData.appointmentEndTime ?? existing.appointmentEndTime;
    const duration = updateData.duration ?? existing.duration;

    const isReschedule =
      data.appointmentDate !== undefined ||
      data.appointmentTime !== undefined ||
      data.appointmentEndTime !== undefined;

    if (isReschedule && data.status === undefined) {
      const rescheduledStatus = resolveAutomaticStatus(existing.status, 'reschedule');
      if (rescheduledStatus) {
        try {
          updateData.status = await appointmentStatusService.assertActiveStatusName(rescheduledStatus);
        } catch {
          updateData.status = rescheduledStatus;
        }
      }
    }

    if (
      providerId &&
      (data.appointmentDate ||
        data.appointmentTime ||
        data.appointmentEndTime ||
        data.duration ||
        data.providerId ||
        data.appointmentType ||
        data.appointmentTypeId)
    ) {
      await appointmentAvailabilityService.assertBookingAllowed({
        providerId,
        departmentId: updateData.departmentId ?? existing.departmentId,
        appointmentDate,
        appointmentTime,
        appointmentEndTime,
        duration,
        excludeAppointmentId: id,
        appointmentType: appointmentTypeRow?.name || null,
      });
    }

    const trackKeys = [
      'patientId',
      'appointmentDate',
      'appointmentTime',
      'appointmentEndTime',
      'duration',
      'appointmentTypeId',
      'visitReason',
      'visitModality',
      'department',
      'departmentId',
      'provider',
      'providerId',
      'status',
      'eventStatus',
      'roomId',
      'notes',
      'accessibilityRequirements',
      'accessibilityRequirementsNotes',
    ];
    const changes = diffFields(existing, { ...existing, ...updateData }, trackKeys);

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: includeRelations,
    });

    if (changes.length) {
      await recordHistory(id, {
        action: isReschedule ? 'rescheduled' : 'updated',
        summary: isReschedule ? 'Reschedule History' : 'Amendment',
        changes,
        userId: user?.id,
        userName: userDisplayName(user),
        userRole: user?.role,
      });
    }

    // Keep claims worklist in sync when appointment is marked Checked Out / Completed
    const nextStatus = normalizeAppointmentStatus(appointment.status);
    if (
      nextStatus === APPOINTMENT_STATUS.CHECKED_OUT ||
      nextStatus === APPOINTMENT_STATUS.COMPLETED
    ) {
      const existingCheckout = await prisma.patientCheckout.findUnique({
        where: { appointmentId: id },
      });
      if (!existingCheckout) {
        await prisma.patientCheckout.create({
          data: {
            patientId: appointment.patientId,
            appointmentId: id,
            status: 'completed',
            completedAt: new Date(),
            completedBy: user?.id || null,
            completedByName: userDisplayName(user),
            isLocked: true,
            createdBy: user?.id || null,
            updatedBy: user?.id || null,
          },
        });
      } else if (existingCheckout.status !== 'completed' || existingCheckout.worklistRemovedAt) {
        await prisma.patientCheckout.update({
          where: { id: existingCheckout.id },
          data: {
            status: 'completed',
            completedAt: existingCheckout.completedAt || new Date(),
            completedBy: existingCheckout.completedBy || user?.id || null,
            completedByName: existingCheckout.completedByName || userDisplayName(user),
            isLocked: true,
            worklistRemovedAt: null,
            updatedBy: user?.id || null,
          },
        });
      }
    }

    return serializeAppointment(appointment);
  },

  async delete(id) {
    return prisma.appointment.delete({ where: { id } });
  },

  async getTodayAppointments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = await prisma.appointment.findMany({
      where: { appointmentDate: today },
      orderBy: { appointmentTime: 'asc' },
      include: includeRelations,
    });
    return rows.map(serializeAppointment);
  },

  parseAccessibilityRequirements,
};

module.exports = appointmentService;
