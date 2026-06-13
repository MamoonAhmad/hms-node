const prisma = require('../lib/prisma');
const appointmentStatusService = require('./appointmentStatus.service');
const appointmentAvailabilityService = require('./appointmentAvailability.service');

const HIDDEN_TIMELINE_STATUSES = ['Cancelled', 'No Show', 'No-Show', 'Deleted'];

const FIELD_LABELS = {
  patientId: 'Patient',
  appointmentDate: 'Appointment Date',
  appointmentTime: 'Appointment Time',
  appointmentEndTime: 'Appointment End Time',
  duration: 'Duration',
  appointmentType: 'Appointment Type',
  appointmentTypeId: 'Appointment Type',
  visitReason: 'Reason for Visit',
  department: 'Department',
  departmentId: 'Department',
  provider: 'Provider',
  providerId: 'Provider',
  status: 'Appointment Status',
  notes: 'Appointment Notes',
};

const patientSelect = {
  id: true,
  mrn: true,
  firstName: true,
  lastName: true,
  middleName: true,
  dateOfBirth: true,
  gender: true,
  contactNumber: true,
  email: true,
  insuranceProvider: true,
};

const providerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  middleName: true,
  npi: true,
};

const includeRelations = {
  patient: { select: patientSelect },
  providerRef: { select: providerSelect },
  departmentRef: { select: { id: true, departmentName: true } },
  appointmentTypeRef: { select: { id: true, name: true } },
};

function serializeAppointment(appointment) {
  if (!appointment) return appointment;
  return {
    ...appointment,
    appointmentType: appointment.appointmentTypeRef?.name || null,
  };
}

function formatProviderName(provider) {
  if (!provider) return null;
  const parts = [provider.firstName, provider.middleName, provider.lastName].filter(Boolean);
  return parts.join(' ') || null;
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

  if (status) conditions.push({ status });
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

async function resolveAppointmentTypeId(nameOrId) {
  if (!nameOrId) {
    const err = new Error('Appointment type is required');
    err.statusCode = 400;
    throw err;
  }

  const byId = await prisma.appointmentType.findFirst({
    where: { id: nameOrId, deletedAt: null, isActive: true },
  });
  if (byId) return byId.id;

  const byName = await prisma.appointmentType.findFirst({
    where: {
      name: { equals: String(nameOrId).trim(), mode: 'insensitive' },
      deletedAt: null,
      isActive: true,
    },
  });
  if (byName) return byName.id;

  const err = new Error('Appointment type not found');
  err.statusCode = 400;
  throw err;
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

async function recordHistory(appointmentId, { action, summary, changes, userId, userName }) {
  return prisma.appointmentHistory.create({
    data: {
      appointmentId,
      action,
      summary,
      changes: changes?.length ? changes : undefined,
      changedBy: userId || null,
      changedByName: userName || null,
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

const appointmentService = {
  async create(data, user) {
    const status = await appointmentStatusService.assertActiveStatusName(data.status || 'Scheduled');
    const providerFields = await resolveProviderFields(data);
    const departmentFields = await resolveDepartmentFields(data);
    const appointmentTypeId = await resolveAppointmentTypeId(
      data.appointmentTypeId || data.appointmentType,
    );

    await appointmentAvailabilityService.assertBookingAllowed({
      providerId: providerFields.providerId,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      appointmentEndTime: data.appointmentEndTime,
      duration: data.duration,
    });

    const encounterNumber = await generateEncounterNumber();
    const patientName = await getPatientDisplayName(data.patientId);

    const appointment = await prisma.appointment.create({
      data: {
        encounterNumber,
        appointmentDate: new Date(data.appointmentDate),
        appointmentTime: data.appointmentTime,
        appointmentEndTime: data.appointmentEndTime || null,
        duration: data.duration || 30,
        appointmentTypeId,
        visitReason: data.visitReason,
        ...departmentFields,
        ...providerFields,
        status,
        notes: data.notes,
        patientId: data.patientId,
        createdBy: user?.id || null,
        updatedBy: user?.id || null,
      },
      include: includeRelations,
    });

    await recordHistory(appointment.id, {
      action: 'created',
      summary: 'Initial Creation',
      changes: [
        { field: 'createdAt', label: 'Created At', to: appointment.createdAt },
        { field: 'createdBy', label: 'Created By', to: user?.name || user?.email || 'System' },
        { field: 'patientId', label: 'Created For', to: patientName },
      ],
      userId: user?.id,
      userName: user?.name || user?.email,
    });

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
        include: includeRelations,
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
      counts[row.status] = row._count._all;
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

  async update(id, data, user) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return null;

    const updateData = { ...data, updatedBy: user?.id || existing.updatedBy };

    if (data.appointmentDate) updateData.appointmentDate = new Date(data.appointmentDate);
    if (data.status !== undefined) {
      updateData.status = await appointmentStatusService.assertActiveStatusName(data.status);
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
    if (data.appointmentType !== undefined || data.appointmentTypeId !== undefined) {
      updateData.appointmentTypeId = await resolveAppointmentTypeId(
        data.appointmentTypeId || data.appointmentType,
      );
    }
    delete updateData.appointmentType;

    const providerId = updateData.providerId ?? existing.providerId;
    const appointmentDate = updateData.appointmentDate ?? existing.appointmentDate;
    const appointmentTime = updateData.appointmentTime ?? existing.appointmentTime;
    const appointmentEndTime = updateData.appointmentEndTime ?? existing.appointmentEndTime;
    const duration = updateData.duration ?? existing.duration;

    if (
      providerId &&
      (data.appointmentDate ||
        data.appointmentTime ||
        data.appointmentEndTime ||
        data.duration ||
        data.providerId)
    ) {
      await appointmentAvailabilityService.assertBookingAllowed({
        providerId,
        appointmentDate,
        appointmentTime,
        appointmentEndTime,
        duration,
        excludeAppointmentId: id,
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
      'department',
      'departmentId',
      'provider',
      'providerId',
      'status',
      'notes',
    ];
    const changes = diffFields(existing, { ...existing, ...updateData }, trackKeys);

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: includeRelations,
    });

    if (changes.length) {
      await recordHistory(id, {
        action: 'updated',
        summary: 'Amendment',
        changes,
        userId: user?.id,
        userName: user?.name || user?.email,
      });
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
};

module.exports = appointmentService;
