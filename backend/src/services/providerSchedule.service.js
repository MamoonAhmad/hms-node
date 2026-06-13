const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const scheduleInclude = {
  provider: {
    include: {
      specialty: { select: { id: true, name: true } },
      subSpecialty: { select: { id: true, name: true } },
    },
  },
  locations: {
    include: { location: { select: { id: true, name: true } } },
  },
  appointmentTypes: {
    include: { appointmentType: { select: { id: true, name: true } } },
  },
};

function parseDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const err = new Error('Invalid date');
    err.statusCode = 400;
    throw err;
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function formatDateOnly(date) {
  if (!date) return null;
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function timeToMinutes(t) {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function dateRangeOverlaps(start1, end1, start2, end2) {
  const s1 = start1 ? new Date(start1).getTime() : 0;
  const e1 = end1 ? new Date(end1).getTime() : Number.MAX_SAFE_INTEGER;
  const s2 = start2 ? new Date(start2).getTime() : 0;
  const e2 = end2 ? new Date(end2).getTime() : Number.MAX_SAFE_INTEGER;
  return s1 < e2 && e1 > s2;
}

function timeRangesOverlap(start1, end1, start2, end2) {
  const a = timeToMinutes(start1);
  const b = timeToMinutes(end1);
  const c = timeToMinutes(start2);
  const d = timeToMinutes(end2);
  return a < d && b > c;
}

function daysOverlap(days1, days2) {
  return (days1 || []).some((d) => (days2 || []).includes(d));
}

function computeDisplayStatus(row) {
  const today = formatDateOnly(todayDateOnly());
  const end = formatDateOnly(row.effectiveEndDate);
  if (end && end < today) return 'Inactive';
  return row.status || 'Active';
}

function formatSchedule(row) {
  const provider = row.provider || {};
  const specialty = provider.specialty?.name || '';
  const subSpecialty = provider.subSpecialty?.name || '';
  const locationRows = (row.locations || []).map((l) => l.location).filter(Boolean);
  const typeRows = (row.appointmentTypes || []).map((t) => t.appointmentType).filter(Boolean);

  return {
    id: row.id,
    providerId: row.providerId,
    providerName: [provider.firstName, provider.lastName].filter(Boolean).join(' '),
    specialty,
    subSpecialty,
    specialtyId: provider.specialty?.id || null,
    subSpecialtyId: provider.subSpecialty?.id || null,
    days: row.days || [],
    startTime: row.startTime,
    endTime: row.endTime,
    slotDuration: row.slotDuration,
    appointmentType: typeRows.map((t) => t.name),
    appointmentTypeIds: typeRows.map((t) => t.id),
    maxAppointmentsPerSlot: row.maxAppointmentsPerSlot,
    overBooking: row.overBooking,
    locations: locationRows.map((l) => l.name),
    locationIds: locationRows.map((l) => l.id),
    effectiveStartDate: formatDateOnly(row.effectiveStartDate),
    effectiveEndDate: formatDateOnly(row.effectiveEndDate),
    endOnEffectiveDate: row.endOnEffectiveDate,
    status: row.status,
    displayStatus: computeDisplayStatus(row),
    teleconsultationAllowed: row.teleconsultationAllowed,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeDays(days) {
  let list;
  if (Array.isArray(days)) {
    list = days.filter(Boolean);
  } else if (typeof days === 'string' && days.trim()) {
    list = days.split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    list = [];
  }
  const invalid = list.filter((d) => !VALID_DAYS.includes(d));
  if (invalid.length) {
    const err = new Error(`Invalid day(s): ${invalid.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  if (!list.length) {
    const err = new Error('At least one day is required');
    err.statusCode = 400;
    throw err;
  }
  return list;
}

function validateTimes(startTime, endTime) {
  if (!startTime || !endTime) {
    const err = new Error('Start time and end time are required');
    err.statusCode = 400;
    throw err;
  }
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    const err = new Error('End time must be later than start time');
    err.statusCode = 400;
    throw err;
  }
}

function validateEffectiveDates(startDate, endDate, endOnEffectiveDate) {
  if (!startDate) {
    const err = new Error('Effective start date is required');
    err.statusCode = 400;
    throw err;
  }
  if (endOnEffectiveDate && !endDate) {
    const err = new Error('Effective end date is required when End Schedule is selected');
    err.statusCode = 400;
    throw err;
  }
  if (endDate && endDate.getTime() <= startDate.getTime()) {
    const err = new Error('Effective end date must be after effective start date');
    err.statusCode = 400;
    throw err;
  }
}

async function assertProviderActive(providerId) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: {
      specialty: { select: { id: true, name: true } },
      subSpecialty: { select: { id: true, name: true } },
    },
  });
  if (!provider) {
    const err = new Error('Provider not found');
    err.statusCode = 404;
    throw err;
  }
  if (!provider.isActive) {
    const err = new Error('Only active providers can be scheduled');
    err.statusCode = 400;
    throw err;
  }
  return provider;
}

async function assertAppointmentTypeIds(ids) {
  if (!ids?.length) {
    const err = new Error('At least one appointment type is required');
    err.statusCode = 400;
    throw err;
  }
  const rows = await prisma.appointmentType.findMany({
    where: { id: { in: ids }, deletedAt: null, isActive: true },
    select: { id: true },
  });
  if (rows.length !== ids.length) {
    const err = new Error('One or more appointment types are invalid or inactive');
    err.statusCode = 400;
    throw err;
  }
}

async function assertLocationIds(ids) {
  if (!ids?.length) return;
  const rows = await prisma.location.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true },
  });
  if (rows.length !== ids.length) {
    const err = new Error('One or more locations are invalid or inactive');
    err.statusCode = 400;
    throw err;
  }
}

async function findOverlappingSchedule({
  providerId,
  startTime,
  endTime,
  days,
  effectiveStartDate,
  effectiveEndDate,
  excludeScheduleId,
}) {
  const existing = await prisma.providerSchedule.findMany({
    where: {
      ...NOT_DELETED,
      providerId,
      ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
    },
  });

  return existing.find((s) => {
    if (!daysOverlap(s.days, days)) return false;
    if (
      !dateRangeOverlaps(
        s.effectiveStartDate,
        s.effectiveEndDate,
        effectiveStartDate,
        effectiveEndDate,
      )
    ) {
      return false;
    }
    if (!timeRangesOverlap(s.startTime, s.endTime, startTime, endTime)) return false;
    return true;
  });
}

function buildListWhere(filters) {
  const conditions = [NOT_DELETED];

  const providerIds = filters.providerIds?.length ? filters.providerIds : [];
  if (providerIds.length) {
    conditions.push({ providerId: { in: providerIds } });
  }

  if (filters.specialtyId) {
    conditions.push({ provider: { specialtyId: filters.specialtyId } });
  }

  if (filters.days?.length) {
    conditions.push({ days: { hasSome: filters.days } });
  }

  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ? parseDateOnly(filters.dateFrom) : null;
    const to = filters.dateTo ? parseDateOnly(filters.dateTo) : null;
    if (from && to && from.getTime() > to.getTime()) {
      return { invalidDateRange: true };
    }
    if (to) {
      conditions.push({ effectiveStartDate: { lte: to } });
    }
    if (from) {
      conditions.push({
        OR: [{ effectiveEndDate: null }, { effectiveEndDate: { gte: from } }],
      });
    }
  }

  const today = todayDateOnly();
  if (filters.status === 'Active') {
    conditions.push({ status: 'Active' });
    conditions.push({
      OR: [{ effectiveEndDate: null }, { effectiveEndDate: { gte: today } }],
    });
  } else if (filters.status === 'Inactive') {
    conditions.push({
      OR: [{ status: 'Inactive' }, { effectiveEndDate: { lt: today } }],
    });
  }

  if (filters.search) {
    const q = filters.search.trim();
    conditions.push({
      OR: [
        { provider: { firstName: { contains: q, mode: 'insensitive' } } },
        { provider: { lastName: { contains: q, mode: 'insensitive' } } },
        { provider: { specialty: { name: { contains: q, mode: 'insensitive' } } } },
        { provider: { subSpecialty: { name: { contains: q, mode: 'insensitive' } } } },
        { startTime: { contains: q, mode: 'insensitive' } },
        { endTime: { contains: q, mode: 'insensitive' } },
        { status: { contains: q, mode: 'insensitive' } },
        { locations: { some: { location: { name: { contains: q, mode: 'insensitive' } } } } },
        {
          appointmentTypes: {
            some: { appointmentType: { name: { contains: q, mode: 'insensitive' } } },
          },
        },
        ...(VALID_DAYS.includes(q) ? [{ days: { has: q } }] : []),
      ],
    });
    const asNum = Number(q);
    if (Number.isInteger(asNum)) {
      conditions[conditions.length - 1].OR.push(
        { overBooking: asNum },
        { maxAppointmentsPerSlot: asNum },
        { slotDuration: asNum },
      );
    }
  }

  return { where: { AND: conditions } };
}

async function syncRelations(scheduleId, locationIds, appointmentTypeIds) {
  await prisma.providerScheduleLocation.deleteMany({ where: { scheduleId } });
  await prisma.providerScheduleAppointmentType.deleteMany({ where: { scheduleId } });

  if (locationIds?.length) {
    await prisma.providerScheduleLocation.createMany({
      data: locationIds.map((locationId) => ({ scheduleId, locationId })),
    });
  }
  if (appointmentTypeIds?.length) {
    await prisma.providerScheduleAppointmentType.createMany({
      data: appointmentTypeIds.map((appointmentTypeId) => ({ scheduleId, appointmentTypeId })),
    });
  }
}

const providerScheduleService = {
  VALID_DAYS,

  formatSchedule,

  async findAll(filters = {}) {
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const built = buildListWhere(filters);
    if (built.invalidDateRange) {
      return {
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const where = built.where;

    const [rows, total] = await Promise.all([
      prisma.providerSchedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ effectiveStartDate: 'desc' }, { createdAt: 'desc' }],
        include: scheduleInclude,
      }),
      prisma.providerSchedule.count({ where }),
    ]);

    return {
      data: rows.map(formatSchedule),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  },

  async findById(id) {
    const row = await prisma.providerSchedule.findFirst({
      where: { id, ...NOT_DELETED },
      include: scheduleInclude,
    });
    return row ? formatSchedule(row) : null;
  },

  async checkOverlap(payload) {
    const days = normalizeDays(payload.days);
    validateTimes(payload.startTime, payload.endTime);
    const effectiveStartDate = parseDateOnly(payload.effectiveStartDate);
    const effectiveEndDate = payload.effectiveEndDate
      ? parseDateOnly(payload.effectiveEndDate)
      : null;

    const conflict = await findOverlappingSchedule({
      providerId: payload.providerId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      days,
      effectiveStartDate,
      effectiveEndDate,
      excludeScheduleId: payload.excludeScheduleId || null,
    });
    return { overlap: !!conflict };
  },

  async create(data, userId) {
    await assertProviderActive(data.providerId);
    const days = normalizeDays(data.days);
    validateTimes(data.startTime, data.endTime);

    const effectiveStartDate = parseDateOnly(data.effectiveStartDate);
    const effectiveEndDate = data.effectiveEndDate ? parseDateOnly(data.effectiveEndDate) : null;
    validateEffectiveDates(effectiveStartDate, effectiveEndDate, !!data.endOnEffectiveDate);

    const locationIds = data.locationIds || [];
    const appointmentTypeIds = data.appointmentTypeIds || [];
    await assertAppointmentTypeIds(appointmentTypeIds);
    await assertLocationIds(locationIds);

    const max = parseInt(data.maxAppointmentsPerSlot, 10);
    if (!Number.isInteger(max) || max < 1) {
      const err = new Error('Max appointments per slot must be a positive integer');
      err.statusCode = 400;
      throw err;
    }

    const overBooking = parseInt(data.overBooking, 10);
    if (!Number.isInteger(overBooking) || overBooking < 0) {
      const err = new Error('Over booking must be a non-negative integer');
      err.statusCode = 400;
      throw err;
    }

    const slotDuration = parseInt(data.slotDuration, 10);
    if (!Number.isInteger(slotDuration) || slotDuration < 1) {
      const err = new Error('Slot duration must be a positive integer');
      err.statusCode = 400;
      throw err;
    }

    const conflict = await findOverlappingSchedule({
      providerId: data.providerId,
      startTime: data.startTime,
      endTime: data.endTime,
      days,
      effectiveStartDate,
      effectiveEndDate,
    });
    if (conflict) {
      const err = new Error('This would overlap with an existing schedule for this provider');
      err.statusCode = 409;
      throw err;
    }

    const row = await prisma.providerSchedule.create({
      data: {
        providerId: data.providerId,
        days,
        startTime: data.startTime,
        endTime: data.endTime,
        slotDuration,
        maxAppointmentsPerSlot: max,
        overBooking,
        effectiveStartDate,
        effectiveEndDate,
        endOnEffectiveDate: !!data.endOnEffectiveDate,
        status: data.status === 'Inactive' ? 'Inactive' : 'Active',
        teleconsultationAllowed: !!data.teleconsultationAllowed,
        createdBy: userId,
        updatedBy: userId,
      },
      include: scheduleInclude,
    });

    await syncRelations(row.id, locationIds, appointmentTypeIds);

    return this.findById(row.id);
  },

  async update(id, data, userId) {
    const existing = await prisma.providerSchedule.findFirst({
      where: { id, ...NOT_DELETED },
    });
    if (!existing) {
      const err = new Error('Schedule not found');
      err.statusCode = 404;
      throw err;
    }

    const providerId = data.providerId || existing.providerId;
    if (data.providerId) await assertProviderActive(providerId);

    const days = data.days !== undefined ? normalizeDays(data.days) : existing.days;
    const startTime = data.startTime !== undefined ? data.startTime : existing.startTime;
    const endTime = data.endTime !== undefined ? data.endTime : existing.endTime;
    validateTimes(startTime, endTime);

    const effectiveStartDate =
      data.effectiveStartDate !== undefined
        ? parseDateOnly(data.effectiveStartDate)
        : existing.effectiveStartDate;
    const effectiveEndDate =
      data.effectiveEndDate !== undefined
        ? data.effectiveEndDate
          ? parseDateOnly(data.effectiveEndDate)
          : null
        : existing.effectiveEndDate;
    const endOnEffectiveDate =
      data.endOnEffectiveDate !== undefined ? !!data.endOnEffectiveDate : existing.endOnEffectiveDate;
    validateEffectiveDates(effectiveStartDate, effectiveEndDate, endOnEffectiveDate);

    const locationIds =
      data.locationIds !== undefined ? data.locationIds || [] : undefined;
    const appointmentTypeIds =
      data.appointmentTypeIds !== undefined ? data.appointmentTypeIds || [] : undefined;

    if (appointmentTypeIds !== undefined) await assertAppointmentTypeIds(appointmentTypeIds);
    if (locationIds !== undefined) await assertLocationIds(locationIds);

    const payload = {
      providerId,
      days,
      startTime,
      endTime,
      effectiveStartDate,
      effectiveEndDate,
      endOnEffectiveDate,
      updatedBy: userId,
    };

    if (data.slotDuration !== undefined) {
      const slotDuration = parseInt(data.slotDuration, 10);
      if (!Number.isInteger(slotDuration) || slotDuration < 1) {
        const err = new Error('Slot duration must be a positive integer');
        err.statusCode = 400;
        throw err;
      }
      payload.slotDuration = slotDuration;
    }
    if (data.maxAppointmentsPerSlot !== undefined) {
      const max = parseInt(data.maxAppointmentsPerSlot, 10);
      if (!Number.isInteger(max) || max < 1) {
        const err = new Error('Max appointments per slot must be a positive integer');
        err.statusCode = 400;
        throw err;
      }
      payload.maxAppointmentsPerSlot = max;
    }
    if (data.overBooking !== undefined) {
      const overBooking = parseInt(data.overBooking, 10);
      if (!Number.isInteger(overBooking) || overBooking < 0) {
        const err = new Error('Over booking must be a non-negative integer');
        err.statusCode = 400;
        throw err;
      }
      payload.overBooking = overBooking;
    }
    if (data.status !== undefined) {
      payload.status = data.status === 'Inactive' ? 'Inactive' : 'Active';
    }
    if (data.teleconsultationAllowed !== undefined) {
      payload.teleconsultationAllowed = !!data.teleconsultationAllowed;
    }

    const conflict = await findOverlappingSchedule({
      providerId,
      startTime,
      endTime,
      days,
      effectiveStartDate,
      effectiveEndDate,
      excludeScheduleId: id,
    });
    if (conflict) {
      const err = new Error('This would overlap with an existing schedule for this provider');
      err.statusCode = 409;
      throw err;
    }

    await prisma.providerSchedule.update({ where: { id }, data: payload });

    if (locationIds !== undefined || appointmentTypeIds !== undefined) {
      const current = await this.findById(id);
      await syncRelations(
        id,
        locationIds !== undefined ? locationIds : current.locationIds,
        appointmentTypeIds !== undefined ? appointmentTypeIds : current.appointmentTypeIds,
      );
    }

    return this.findById(id);
  },

  async toggleStatus(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Schedule not found');
      err.statusCode = 404;
      throw err;
    }
    const nextStatus = existing.status === 'Active' ? 'Inactive' : 'Active';
    await prisma.providerSchedule.update({
      where: { id },
      data: { status: nextStatus, updatedBy: userId },
    });
    return this.findById(id);
  },

  async delete(id, userId) {
    const existing = await prisma.providerSchedule.findFirst({
      where: { id, ...NOT_DELETED },
    });
    if (!existing) {
      const err = new Error('Schedule not found');
      err.statusCode = 404;
      throw err;
    }
    await prisma.providerSchedule.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'Inactive', updatedBy: userId },
    });
    return { id };
  },
};

module.exports = providerScheduleService;
