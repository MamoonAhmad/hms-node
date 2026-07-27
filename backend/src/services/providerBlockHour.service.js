const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALL_DAYS = [...VALID_DAYS];

const blockInclude = {
  provider: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      npi: true,
      isActive: true,
    },
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

function isScheduleActive(schedule) {
  if (schedule.status !== 'Active') return false;
  const today = formatDateOnly(todayDateOnly());
  const end = formatDateOnly(schedule.effectiveEndDate);
  if (end && end < today) return false;
  return true;
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

  if (list.length === 1 && list[0].toLowerCase() === 'all') {
    return [...ALL_DAYS];
  }
  if (list.length === VALID_DAYS.length && VALID_DAYS.every((d) => list.includes(d))) {
    return [...ALL_DAYS];
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

function validateEffectiveDates(startDate, endDate) {
  if (!startDate) {
    const err = new Error('Start date is required');
    err.statusCode = 400;
    throw err;
  }
  if (endDate && endDate.getTime() < startDate.getTime()) {
    const err = new Error('End date must be on or after start date');
    err.statusCode = 400;
    throw err;
  }
}

function formatBlock(row) {
  const provider = row.provider || {};
  return {
    id: row.id,
    providerId: row.providerId,
    providerName: [provider.firstName, provider.lastName].filter(Boolean).join(' '),
    providerNpi: provider.npi || null,
    days: row.days || [],
    startTime: row.startTime,
    endTime: row.endTime,
    effectiveStartDate: formatDateOnly(row.effectiveStartDate),
    effectiveEndDate: formatDateOnly(row.effectiveEndDate),
    reason: row.reason || '',
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function assertProviderExists(providerId) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { id: true, isActive: true, firstName: true, lastName: true },
  });
  if (!provider) {
    const err = new Error('Provider not found');
    err.statusCode = 404;
    throw err;
  }
  return provider;
}

async function assertWithinProviderSchedule({
  providerId,
  startTime,
  endTime,
  days,
  effectiveStartDate,
  effectiveEndDate,
}) {
  const schedules = await prisma.providerSchedule.findMany({
    where: { ...NOT_DELETED, providerId },
  });
  const activeSchedules = schedules.filter(isScheduleActive);
  if (!activeSchedules.length) {
    const err = new Error(
      'Block hours must be within the provider\'s existing active schedule (days, time, and date range)',
    );
    err.statusCode = 400;
    throw err;
  }

  const blockStart = timeToMinutes(startTime);
  const blockEnd = timeToMinutes(endTime);

  const allDaysCovered = days.every((day) =>
    activeSchedules.some((schedule) => {
      if (!(schedule.days || []).includes(day)) return false;
      if (
        !dateRangeOverlaps(
          schedule.effectiveStartDate,
          schedule.effectiveEndDate,
          effectiveStartDate,
          effectiveEndDate,
        )
      ) {
        return false;
      }
      const schedStart = timeToMinutes(schedule.startTime);
      const schedEnd = timeToMinutes(schedule.endTime);
      return schedStart <= blockStart && schedEnd >= blockEnd;
    }),
  );

  if (!allDaysCovered) {
    const err = new Error(
      'Block hours must be within the provider\'s existing active schedule (days, time, and date range)',
    );
    err.statusCode = 400;
    throw err;
  }
}

async function findOverlappingBlock({
  providerId,
  startTime,
  endTime,
  days,
  effectiveStartDate,
  effectiveEndDate,
  status,
  excludeBlockId,
}) {
  if (status !== 'Active') return null;

  const existing = await prisma.providerBlockHour.findMany({
    where: {
      ...NOT_DELETED,
      providerId,
      status: 'Active',
      ...(excludeBlockId ? { id: { not: excludeBlockId } } : {}),
    },
  });

  return existing.find((block) => {
    if (!daysOverlap(block.days, days)) return false;
    if (
      !dateRangeOverlaps(
        block.effectiveStartDate,
        block.effectiveEndDate,
        effectiveStartDate,
        effectiveEndDate,
      )
    ) {
      return false;
    }
    if (!timeRangesOverlap(block.startTime, block.endTime, startTime, endTime)) return false;
    return true;
  });
}

function buildListWhere(filters) {
  const conditions = [NOT_DELETED];

  if (filters.providerId) {
    conditions.push({ providerId: filters.providerId });
  }

  if (filters.departmentId) {
    conditions.push({
      provider: {
        OR: [
          { departmentId: filters.departmentId },
          { departmentLinks: { some: { departmentId: filters.departmentId } } },
        ],
      },
    });
  }

  if (filters.days?.length) {
    conditions.push({ days: { hasSome: filters.days } });
  }

  if (filters.status) {
    conditions.push({ status: filters.status });
  }

  if (filters.search) {
    const q = filters.search.trim();
    conditions.push({
      OR: [
        { provider: { firstName: { contains: q, mode: 'insensitive' } } },
        { provider: { lastName: { contains: q, mode: 'insensitive' } } },
        { provider: { npi: { contains: q, mode: 'insensitive' } } },
        { startTime: { contains: q, mode: 'insensitive' } },
        { endTime: { contains: q, mode: 'insensitive' } },
        { reason: { contains: q, mode: 'insensitive' } },
        { status: { contains: q, mode: 'insensitive' } },
        ...(VALID_DAYS.includes(q) ? [{ days: { has: q } }] : []),
      ],
    });
  }

  return { AND: conditions };
}

const providerBlockHourService = {
  VALID_DAYS,
  ALL_DAYS,

  formatBlock,

  async findAll(filters = {}) {
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const where = buildListWhere(filters);

    const [rows, total] = await Promise.all([
      prisma.providerBlockHour.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ effectiveStartDate: 'desc' }, { createdAt: 'desc' }],
        include: blockInclude,
      }),
      prisma.providerBlockHour.count({ where }),
    ]);

    return {
      data: rows.map(formatBlock),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  },

  async findById(id) {
    const row = await prisma.providerBlockHour.findFirst({
      where: { id, ...NOT_DELETED },
      include: blockInclude,
    });
    return row ? formatBlock(row) : null;
  },

  async checkOverlap(payload) {
    const days = normalizeDays(payload.days);
    validateTimes(payload.startTime, payload.endTime);
    const effectiveStartDate = parseDateOnly(payload.effectiveStartDate);
    const effectiveEndDate = payload.effectiveEndDate
      ? parseDateOnly(payload.effectiveEndDate)
      : null;

    const conflict = await findOverlappingBlock({
      providerId: payload.providerId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      days,
      effectiveStartDate,
      effectiveEndDate,
      status: payload.status || 'Active',
      excludeBlockId: payload.excludeBlockId || null,
    });
    return { overlap: !!conflict };
  },

  async validateWithinSchedule(payload) {
    const days = normalizeDays(payload.days);
    validateTimes(payload.startTime, payload.endTime);
    const effectiveStartDate = parseDateOnly(payload.effectiveStartDate);
    const effectiveEndDate = payload.effectiveEndDate
      ? parseDateOnly(payload.effectiveEndDate)
      : null;

    try {
      await assertWithinProviderSchedule({
        providerId: payload.providerId,
        startTime: payload.startTime,
        endTime: payload.endTime,
        days,
        effectiveStartDate,
        effectiveEndDate,
      });
      return { withinSchedule: true };
    } catch (error) {
      if (error?.statusCode === 400) {
        return { withinSchedule: false, message: error.message };
      }
      throw error;
    }
  },

  async create(data, userId) {
    await assertProviderExists(data.providerId);
    const days = normalizeDays(data.days);
    validateTimes(data.startTime, data.endTime);

    const effectiveStartDate = parseDateOnly(data.effectiveStartDate);
    const effectiveEndDate = data.effectiveEndDate ? parseDateOnly(data.effectiveEndDate) : null;
    validateEffectiveDates(effectiveStartDate, effectiveEndDate);

    const status = data.status === 'Inactive' ? 'Inactive' : 'Active';
    const reason =
      data.reason != null && String(data.reason).trim() !== ''
        ? String(data.reason).trim()
        : null;

    await assertWithinProviderSchedule({
      providerId: data.providerId,
      startTime: data.startTime,
      endTime: data.endTime,
      days,
      effectiveStartDate,
      effectiveEndDate,
    });

    const conflict = await findOverlappingBlock({
      providerId: data.providerId,
      startTime: data.startTime,
      endTime: data.endTime,
      days,
      effectiveStartDate,
      effectiveEndDate,
      status,
    });
    if (conflict) {
      const err = new Error('This would overlap with an existing active block for this provider');
      err.statusCode = 409;
      throw err;
    }

    const row = await prisma.providerBlockHour.create({
      data: {
        providerId: data.providerId,
        days,
        startTime: data.startTime,
        endTime: data.endTime,
        effectiveStartDate,
        effectiveEndDate,
        reason,
        status,
        createdBy: userId,
        updatedBy: userId,
      },
      include: blockInclude,
    });

    return formatBlock(row);
  },

  async update(id, data, userId) {
    const existing = await prisma.providerBlockHour.findFirst({
      where: { id, ...NOT_DELETED },
    });
    if (!existing) {
      const err = new Error('Block not found');
      err.statusCode = 404;
      throw err;
    }

    const providerId = data.providerId || existing.providerId;
    if (data.providerId) await assertProviderExists(providerId);

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
    validateEffectiveDates(effectiveStartDate, effectiveEndDate);

    const status = data.status !== undefined
      ? data.status === 'Inactive'
        ? 'Inactive'
        : 'Active'
      : existing.status;

    const payload = {
      providerId,
      days,
      startTime,
      endTime,
      effectiveStartDate,
      effectiveEndDate,
      status,
      updatedBy: userId,
    };

    if (data.reason !== undefined) {
      payload.reason =
        data.reason != null && String(data.reason).trim() !== ''
          ? String(data.reason).trim()
          : null;
    }

    await assertWithinProviderSchedule({
      providerId,
      startTime,
      endTime,
      days,
      effectiveStartDate,
      effectiveEndDate,
    });

    const conflict = await findOverlappingBlock({
      providerId,
      startTime,
      endTime,
      days,
      effectiveStartDate,
      effectiveEndDate,
      status,
      excludeBlockId: id,
    });
    if (conflict) {
      const err = new Error('This would overlap with an existing active block for this provider');
      err.statusCode = 409;
      throw err;
    }

    const row = await prisma.providerBlockHour.update({
      where: { id },
      data: payload,
      include: blockInclude,
    });

    return formatBlock(row);
  },

  async toggleStatus(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Block not found');
      err.statusCode = 404;
      throw err;
    }
    const nextStatus = existing.status === 'Active' ? 'Inactive' : 'Active';

    if (nextStatus === 'Active') {
      const days = existing.days;
      const effectiveStartDate = parseDateOnly(existing.effectiveStartDate);
      const effectiveEndDate = existing.effectiveEndDate
        ? parseDateOnly(existing.effectiveEndDate)
        : null;

      await assertWithinProviderSchedule({
        providerId: existing.providerId,
        startTime: existing.startTime,
        endTime: existing.endTime,
        days,
        effectiveStartDate,
        effectiveEndDate,
      });

      const conflict = await findOverlappingBlock({
        providerId: existing.providerId,
        startTime: existing.startTime,
        endTime: existing.endTime,
        days,
        effectiveStartDate,
        effectiveEndDate,
        status: 'Active',
        excludeBlockId: id,
      });
      if (conflict) {
        const err = new Error('Cannot activate — this block overlaps with another active block');
        err.statusCode = 409;
        throw err;
      }
    }

    const row = await prisma.providerBlockHour.update({
      where: { id },
      data: { status: nextStatus, updatedBy: userId },
      include: blockInclude,
    });

    return formatBlock(row);
  },

  async delete(id, userId) {
    const existing = await prisma.providerBlockHour.findFirst({
      where: { id, ...NOT_DELETED },
    });
    if (!existing) {
      const err = new Error('Block not found');
      err.statusCode = 404;
      throw err;
    }
    await prisma.providerBlockHour.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'Inactive', updatedBy: userId },
    });
    return { id };
  },
};

module.exports = providerBlockHourService;
