const prisma = require('../lib/prisma');
const appointmentStatusService = require('./appointmentStatus.service');

const HIDDEN_BOARD_STATUSES = ['Cancelled', 'No Show', 'No-Show', 'Deleted'];

const INDICATOR_GROUPS = {
  scheduled: ['Scheduled', 'Rescheduled'],
  arrived: ['Arrived', 'Checked-In'],
  roomed: ['Roomed'],
  withProvider: ['With Provider', 'In Progress'],
  providerOut: ['Provider Out'],
  checkout: ['Check out', 'Completed'],
};

const patientSelect = {
  id: true,
  mrn: true,
  firstName: true,
  lastName: true,
  middleName: true,
  registrationStatus: true,
  consentFormSigned: true,
  insuranceProviderId: true,
  insuranceProvider: { select: { id: true, name: true } },
  insurances: {
    select: {
      insuranceType: true,
      insuranceProvider: { select: { name: true } },
    },
  },
};

const includeRelations = {
  patient: { select: patientSelect },
  providerRef: {
    select: { id: true, firstName: true, lastName: true, middleName: true },
  },
  appointmentTypeRef: { select: { id: true, name: true } },
  room: { select: { id: true, roomNumber: true, displayName: true } },
  orders: {
    select: { id: true, status: true },
    where: { status: { notIn: ['Completed', 'Cancelled'] } },
  },
};

function formatProviderName(provider) {
  if (!provider) return null;
  return [provider.firstName, provider.middleName, provider.lastName].filter(Boolean).join(' ');
}

function formatPatientName(patient) {
  if (!patient) return '';
  return [patient.lastName, [patient.firstName, patient.middleName].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
}

function isRegistrationIncomplete(patient) {
  const status = (patient?.registrationStatus || '').toLowerCase();
  return status !== 'complete' && status !== 'completed';
}

function deriveInsuranceStatus(patient) {
  if (!patient) return 'Unknown';
  if (patient.insurances?.length) return 'Verified';
  if (patient.insuranceProviderId || patient.insuranceProvider) return 'On file';
  return 'Missing';
}

function computeWaitingMinutes(appointment) {
  const now = Date.now();
  if (appointment.arrivalTime) {
    return Math.max(0, Math.floor((now - new Date(appointment.arrivalTime).getTime()) / 60000));
  }
  const arrivedStatuses = [...INDICATOR_GROUPS.arrived, ...INDICATOR_GROUPS.roomed, ...INDICATOR_GROUPS.withProvider, ...INDICATOR_GROUPS.providerOut];
  if (!arrivedStatuses.includes(appointment.status)) return null;
  const [hours, minutes] = (appointment.appointmentTime || '00:00').split(':').map(Number);
  const base = new Date(appointment.appointmentDate);
  base.setHours(hours || 0, minutes || 0, 0, 0);
  return Math.max(0, Math.floor((now - base.getTime()) / 60000));
}

function getIndicatorKey(appointment) {
  const status = appointment.status;
  if (INDICATOR_GROUPS.scheduled.includes(status)) return 'scheduled';
  if (INDICATOR_GROUPS.arrived.includes(status)) return 'arrived';
  if (INDICATOR_GROUPS.roomed.includes(status)) return 'roomed';
  if (INDICATOR_GROUPS.withProvider.includes(status)) return 'withProvider';
  if (INDICATOR_GROUPS.providerOut.includes(status)) return 'providerOut';
  if (INDICATOR_GROUPS.checkout.includes(status)) return 'checkout';
  if (status === 'Registration Incomplete') return 'registrationIncomplete';
  return 'other';
}

function serializeRow(appointment) {
  const flags = Array.isArray(appointment.alertsFlags)
    ? appointment.alertsFlags
    : appointment.alertsFlags?.flags || [];

  return {
    id: appointment.id,
    encounterNumber: appointment.encounterNumber,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    status: appointment.status,
    visitType: appointment.appointmentTypeRef?.name || null,
    provider: appointment.provider || formatProviderName(appointment.providerRef),
    providerId: appointment.providerId,
    room: appointment.room
      ? appointment.room.displayName || appointment.room.roomNumber
      : null,
    roomId: appointment.roomId,
    chiefComplaint: appointment.chiefComplaint || appointment.visitReason || null,
    assignedNurseName: appointment.assignedNurseName,
    arrivalTime: appointment.arrivalTime,
    checkoutStatus: appointment.checkoutStatus || 'Pending',
    alertsFlags: flags,
    updatedAt: appointment.updatedAt,
    waitingMinutes: computeWaitingMinutes(appointment),
    ordersPending: appointment.orders?.length || 0,
    insuranceStatus: deriveInsuranceStatus(appointment.patient),
    registrationIncomplete: isRegistrationIncomplete(appointment.patient),
    indicatorKey: getIndicatorKey(appointment),
    patient: {
      id: appointment.patient.id,
      mrn: appointment.patient.mrn,
      firstName: appointment.patient.firstName,
      lastName: appointment.patient.lastName,
      middleName: appointment.patient.middleName,
      displayName: formatPatientName(appointment.patient),
      registrationStatus: appointment.patient.registrationStatus,
    },
  };
}

function buildWhereClause(filters = {}) {
  const {
    search,
    status,
    providerId,
    date,
    dateFrom,
    dateTo,
    arrivalTimeFilter,
    indicator,
  } = filters;

  const conditions = [{ status: { notIn: HIDDEN_BOARD_STATUSES } }];

  if (search) {
    conditions.push({
      OR: [
        { encounterNumber: { contains: search, mode: 'insensitive' } },
        { chiefComplaint: { contains: search, mode: 'insensitive' } },
        { visitReason: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { mrn: { contains: search, mode: 'insensitive' } } },
        { providerRef: { firstName: { contains: search, mode: 'insensitive' } } },
        { providerRef: { lastName: { contains: search, mode: 'insensitive' } } },
        { room: { roomNumber: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  if (status) conditions.push({ status });
  if (providerId) conditions.push({ providerId });

  if (date) {
    conditions.push({ appointmentDate: new Date(date) });
  } else if (dateFrom || dateTo) {
    const range = {};
    if (dateFrom) range.gte = new Date(dateFrom);
    if (dateTo) range.lte = new Date(dateTo);
    conditions.push({ appointmentDate: range });
  }

  if (arrivalTimeFilter === 'morning') {
    conditions.push({ appointmentTime: { lt: '12:00' } });
  } else if (arrivalTimeFilter === 'afternoon') {
    conditions.push({ appointmentTime: { gte: '12:00' } });
  } else if (arrivalTimeFilter === 'not_arrived') {
    conditions.push({
      arrivalTime: null,
      status: { in: INDICATOR_GROUPS.scheduled },
    });
  }

  if (indicator === 'registrationIncomplete') {
    conditions.push({
      patient: {
        registrationStatus: { notIn: ['complete', 'completed'] },
      },
      status: { notIn: HIDDEN_BOARD_STATUSES },
    });
  } else if (indicator && INDICATOR_GROUPS[indicator]) {
    conditions.push({ status: { in: INDICATOR_GROUPS[indicator] } });
  }

  return { AND: conditions };
}

function computeIndicators(rows) {
  const counts = {
    total: rows.length,
    scheduled: 0,
    arrived: 0,
    registrationIncomplete: 0,
    roomed: 0,
    withProvider: 0,
    providerOut: 0,
    checkout: 0,
  };

  rows.forEach((row) => {
    const key = row.indicatorKey;
    if (key && key !== 'other' && counts[key] !== undefined) {
      counts[key] += 1;
    }
    if (row.registrationIncomplete) {
      counts.registrationIncomplete += 1;
    }
  });

  return counts;
}

const trackingBoardService = {
  async findAll(filters = {}) {
    const { page = 1, limit = 25 } = filters;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = buildWhereClause(filters);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: parseInt(limit, 10) || 25,
        orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
        include: includeRelations,
      }),
      prisma.appointment.count({ where }),
    ]);

    const allForIndicators = await prisma.appointment.findMany({
      where: buildWhereClause({ ...filters, indicator: undefined, page: undefined, limit: undefined }),
      include: includeRelations,
    });
    const serializedAll = allForIndicators.map(serializeRow);
    const indicators = computeIndicators(serializedAll);
    const data = appointments.map(serializeRow);

    return {
      data,
      indicators,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  },

  async assignRoom(appointmentId, roomId, user) {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      const err = new Error('Appointment not found');
      err.statusCode = 404;
      throw err;
    }

    const room = await prisma.room.findFirst({
      where: { id: roomId, deletedAt: null, status: 'active' },
    });
    if (!room) {
      const err = new Error('Room not found');
      err.statusCode = 400;
      throw err;
    }

    const updateData = {
      roomId: room.id,
      updatedBy: user?.id || appointment.updatedBy,
    };

    const roomedStatuses = INDICATOR_GROUPS.roomed;
    if (!roomedStatuses.includes(appointment.status) && !INDICATOR_GROUPS.withProvider.includes(appointment.status)) {
      updateData.status = await appointmentStatusService.assertActiveStatusName('Roomed');
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: includeRelations,
    });

    return serializeRow(updated);
  },
};

module.exports = trackingBoardService;
