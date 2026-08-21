const prisma = require('../lib/prisma');
const appointmentService = require('./appointment.service');

const ACTIVE_STATUSES = ['Waiting', 'Offered'];
const CLOSED_STATUSES = ['Booked', 'Declined', 'Expired', 'Cancelled', 'Removed'];
const PRIORITY_RANK = { urgent: 0, high: 1, normal: 2, low: 3 };

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function emptyToNull(value) {
  if (value === '' || value === undefined) return null;
  return value;
}

function toDateOrNull(value) {
  if (!value) return null;
  return new Date(value);
}

function providerName(provider) {
  if (!provider) return null;
  return [provider.firstName, provider.middleName, provider.lastName].filter(Boolean).join(' ');
}

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
  preferredProvider: { select: providerSelect },
  offeredProvider: { select: providerSelect },
  preferredDepartment: { select: { id: true, departmentName: true } },
  appointmentType: { select: { id: true, name: true } },
  sourceAppointment: {
    select: { id: true, encounterNumber: true, appointmentDate: true, appointmentTime: true, status: true },
  },
  bookedAppointment: {
    select: { id: true, encounterNumber: true, appointmentDate: true, appointmentTime: true, status: true },
  },
};

async function recordEvent(waitlistEntryId, { action, summary, meta, user }) {
  return prisma.waitlistEvent.create({
    data: {
      waitlistEntryId,
      action,
      summary,
      meta: meta || undefined,
      createdBy: user?.id || null,
      createdByName: user?.name || user?.email || null,
    },
  });
}

function buildWhere(filters = {}) {
  const {
    search,
    status,
    priority,
    patientId,
    preferredProviderId,
    preferredDepartmentId,
    appointmentTypeId,
    dateFrom,
    dateTo,
    activeOnly,
  } = filters;

  const conditions = [];

  if (status) conditions.push({ status });
  else if (activeOnly) conditions.push({ status: { in: ACTIVE_STATUSES } });

  if (priority) conditions.push({ priority });
  if (patientId) conditions.push({ patientId });
  if (preferredProviderId) conditions.push({ preferredProviderId });
  if (preferredDepartmentId) conditions.push({ preferredDepartmentId });
  if (appointmentTypeId) conditions.push({ appointmentTypeId });

  if (dateFrom || dateTo) {
    const range = {};
    if (dateFrom) range.gte = new Date(dateFrom);
    if (dateTo) range.lte = new Date(dateTo);
    conditions.push({
      OR: [
        { preferredDateFrom: range },
        { preferredDateTo: range },
        {
          AND: [
            { preferredDateFrom: null },
            { preferredDateTo: null },
          ],
        },
      ],
    });
  }

  if (search) {
    conditions.push({
      OR: [
        { reason: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        {
          patient: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { mrn: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ],
    });
  }

  return conditions.length ? { AND: conditions } : {};
}

function normalizePayload(data) {
  return {
    patientId: data.patientId,
    preferredProviderId: emptyToNull(data.preferredProviderId),
    preferredDepartmentId: emptyToNull(data.preferredDepartmentId),
    appointmentTypeId: emptyToNull(data.appointmentTypeId),
    preferredDateFrom: toDateOrNull(data.preferredDateFrom),
    preferredDateTo: toDateOrNull(data.preferredDateTo),
    preferredDays: data.preferredDays === undefined ? undefined : data.preferredDays,
    preferredTimes: data.preferredTimes === undefined ? undefined : data.preferredTimes,
    preferredTimeWindow: data.preferredTimeWindow || 'any',
    priority: data.priority || 'normal',
    reason: emptyToNull(data.reason),
    notes: emptyToNull(data.notes),
    contactPhone: emptyToNull(data.contactPhone),
    contactEmail: emptyToNull(data.contactEmail),
    sourceAppointmentId: emptyToNull(data.sourceAppointmentId),
    position: data.position != null ? parseInt(data.position, 10) : undefined,
  };
}

function hourInWindow(startTime, window) {
  if (!window || window === 'any') return true;
  const hour = parseInt(String(startTime || '12:00').split(':')[0], 10);
  if (window === 'morning') return hour < 12;
  if (window === 'afternoon') return hour >= 12 && hour < 17;
  if (window === 'evening') return hour >= 17;
  return true;
}

function dateMatchesPreferences(entry, dateStr, startTime) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;

  if (entry.preferredDateFrom) {
    const from = new Date(entry.preferredDateFrom);
    from.setHours(0, 0, 0, 0);
    if (date < from) return false;
  }
  if (entry.preferredDateTo) {
    const to = new Date(entry.preferredDateTo);
    to.setHours(23, 59, 59, 999);
    if (date > to) return false;
  }

  const days = Array.isArray(entry.preferredDays) ? entry.preferredDays : null;
  if (days?.length) {
    const dayName = DAY_NAMES[date.getDay()];
    if (!days.includes(dayName)) return false;
  }

  if (!hourInWindow(startTime, entry.preferredTimeWindow)) return false;

  const preferredTimes = Array.isArray(entry.preferredTimes) ? entry.preferredTimes : null;
  if (preferredTimes?.length && startTime) {
    if (!preferredTimes.includes(startTime)) return false;
  }

  return true;
}

function sortWaitlist(a, b) {
  const pa = PRIORITY_RANK[a.priority] ?? 99;
  const pb = PRIORITY_RANK[b.priority] ?? 99;
  if (pa !== pb) return pa - pb;
  if ((a.position || 0) !== (b.position || 0)) return (a.position || 0) - (b.position || 0);
  return new Date(a.createdAt) - new Date(b.createdAt);
}

const waitlistService = {
  async create(data, user) {
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, deletedAt: null },
      select: { id: true },
    });
    if (!patient) throw httpError('Patient not found', 404);

    const payload = normalizePayload(data);
    delete payload.patientId;

    const duplicate = await prisma.waitlistEntry.findFirst({
      where: {
        patientId: data.patientId,
        status: { in: ACTIVE_STATUSES },
        preferredProviderId: payload.preferredProviderId,
        appointmentTypeId: payload.appointmentTypeId,
      },
    });
    if (duplicate) {
      throw httpError('An active waitlist entry already exists for this patient with the same preferences');
    }

    const entry = await prisma.waitlistEntry.create({
      data: {
        patientId: data.patientId,
        ...payload,
        preferredDays: payload.preferredDays ?? undefined,
        preferredTimes: payload.preferredTimes ?? undefined,
        status: 'Waiting',
        createdBy: user?.id || null,
        updatedBy: user?.id || null,
      },
      include: includeRelations,
    });

    await recordEvent(entry.id, {
      action: 'created',
      summary: 'Added to waitlist',
      meta: { priority: entry.priority, reason: entry.reason },
      user,
    });

    return entry;
  },

  async findAll(filters = {}) {
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const where = buildWhere(filters);

    const [rows, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
        include: includeRelations,
      }),
      prisma.waitlistEntry.count({ where }),
    ]);

    const sorted = [...rows].sort(sortWaitlist);

    return {
      data: sorted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  },

  async getStatusCounts(filters = {}) {
    const where = buildWhere({ ...filters, status: undefined, activeOnly: undefined });
    const grouped = await prisma.waitlistEntry.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });
    const counts = { all: 0 };
    grouped.forEach((row) => {
      counts[row.status] = row._count._all;
      counts.all += row._count._all;
    });
    ACTIVE_STATUSES.forEach((s) => {
      if (counts[s] == null) counts[s] = 0;
    });
    CLOSED_STATUSES.forEach((s) => {
      if (counts[s] == null) counts[s] = 0;
    });
    counts.active = (counts.Waiting || 0) + (counts.Offered || 0);
    return counts;
  },

  async findById(id) {
    return prisma.waitlistEntry.findUnique({
      where: { id },
      include: {
        ...includeRelations,
        events: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
  },

  async getEvents(id) {
    const entry = await prisma.waitlistEntry.findUnique({ where: { id }, select: { id: true } });
    if (!entry) return null;
    return prisma.waitlistEvent.findMany({
      where: { waitlistEntryId: id },
      orderBy: { createdAt: 'desc' },
    });
  },

  async update(id, data, user) {
    const existing = await prisma.waitlistEntry.findUnique({ where: { id } });
    if (!existing) return null;
    if (CLOSED_STATUSES.includes(existing.status) && existing.status !== 'Declined') {
      throw httpError(`Cannot update a waitlist entry with status "${existing.status}"`);
    }

    const payload = normalizePayload({ ...data, patientId: existing.patientId });
    delete payload.patientId;
    delete payload.sourceAppointmentId;

    const updated = await prisma.waitlistEntry.update({
      where: { id },
      data: {
        ...payload,
        preferredDays: data.preferredDays !== undefined ? data.preferredDays : undefined,
        preferredTimes: data.preferredTimes !== undefined ? data.preferredTimes : undefined,
        updatedBy: user?.id || null,
      },
      include: includeRelations,
    });

    await recordEvent(id, {
      action: data.priority && data.priority !== existing.priority ? 'priority_changed' : 'updated',
      summary:
        data.priority && data.priority !== existing.priority
          ? `Priority changed to ${data.priority}`
          : 'Waitlist entry updated',
      meta: payload,
      user,
    });

    return updated;
  },

  async findMatches({
    providerId,
    date,
    startTime,
    endTime,
    appointmentTypeId,
    departmentId,
    limit = 20,
  }) {
    const dateStr =
      typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().slice(0, 10);

    const and = [{ status: 'Waiting' }];
    and.push({
      OR: [{ preferredProviderId: null }, { preferredProviderId: providerId }],
    });
    if (appointmentTypeId) {
      and.push({
        OR: [{ appointmentTypeId: null }, { appointmentTypeId }],
      });
    }
    if (departmentId) {
      and.push({
        OR: [{ preferredDepartmentId: null }, { preferredDepartmentId: departmentId }],
      });
    }

    const candidates = await prisma.waitlistEntry.findMany({
      where: { AND: and },
      include: includeRelations,
      take: 200,
    });

    const matched = candidates
      .filter((entry) => dateMatchesPreferences(entry, dateStr, startTime || '09:00'))
      .sort(sortWaitlist)
      .slice(0, limit);

    return {
      slot: { providerId, date: dateStr, startTime, endTime },
      data: matched,
      total: matched.length,
    };
  },

  async offer(id, body, user) {
    const existing = await this.findById(id);
    if (!existing) throw httpError('Waitlist entry not found', 404);
    if (existing.status !== 'Waiting' && existing.status !== 'Declined') {
      throw httpError(`Cannot offer a slot when status is "${existing.status}"`);
    }

    const offerExpiresAt = body.offerExpiresAt
      ? new Date(body.offerExpiresAt)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updated = await prisma.waitlistEntry.update({
      where: { id },
      data: {
        status: 'Offered',
        offeredAt: new Date(),
        offerExpiresAt,
        offeredSlotDate: new Date(body.slotDate),
        offeredSlotStart: body.slotStart,
        offeredSlotEnd: body.slotEnd || null,
        offeredProviderId: body.providerId,
        offeredBy: user?.id || null,
        notifiedAt: body.notifyPatient !== false ? new Date() : existing.notifiedAt,
        notes: body.notes ? `${existing.notes || ''}\n[Offer] ${body.notes}`.trim() : existing.notes,
        updatedBy: user?.id || null,
        closedAt: null,
        closedReason: null,
      },
      include: includeRelations,
    });

    await recordEvent(id, {
      action: 'offered',
      summary: `Slot offered ${String(body.slotDate).slice(0, 10)} ${body.slotStart}`,
      meta: {
        providerId: body.providerId,
        slotDate: body.slotDate,
        slotStart: body.slotStart,
        slotEnd: body.slotEnd,
        offerExpiresAt,
        notifyPatient: body.notifyPatient !== false,
      },
      user,
    });

    return {
      entry: updated,
      notified: body.notifyPatient !== false,
    };
  },

  async declineOffer(id, body, user) {
    const existing = await this.findById(id);
    if (!existing) throw httpError('Waitlist entry not found', 404);
    if (existing.status !== 'Offered') {
      throw httpError('Only offered entries can decline an offer');
    }

    const returnToWaiting = body.returnToWaiting !== false;
    const nextStatus = returnToWaiting ? 'Waiting' : 'Declined';

    const updated = await prisma.waitlistEntry.update({
      where: { id },
      data: {
        status: nextStatus,
        offeredAt: null,
        offerExpiresAt: null,
        offeredSlotDate: null,
        offeredSlotStart: null,
        offeredSlotEnd: null,
        offeredProviderId: null,
        offeredBy: null,
        closedAt: returnToWaiting ? null : new Date(),
        closedReason: returnToWaiting ? null : body.reason || 'Offer declined',
        updatedBy: user?.id || null,
      },
      include: includeRelations,
    });

    await recordEvent(id, {
      action: 'offer_declined',
      summary: returnToWaiting
        ? `Offer declined — returned to waiting${body.reason ? `: ${body.reason}` : ''}`
        : `Offer declined — closed${body.reason ? `: ${body.reason}` : ''}`,
      meta: { returnToWaiting, reason: body.reason || null },
      user,
    });

    return updated;
  },

  async book(id, body, user) {
    const existing = await this.findById(id);
    if (!existing) throw httpError('Waitlist entry not found', 404);
    if (!['Waiting', 'Offered', 'Declined'].includes(existing.status)) {
      throw httpError(`Cannot book from waitlist status "${existing.status}"`);
    }

    const appointmentTypeId =
      body.appointmentTypeId || existing.appointmentTypeId || existing.appointmentType?.id;
    if (!appointmentTypeId) {
      throw httpError('Appointment type is required to book from waitlist');
    }

    const created = await appointmentService.create(
      {
        patientId: existing.patientId,
        appointmentDate: body.appointmentDate,
        appointmentTime: body.appointmentTime,
        appointmentEndTime: body.appointmentEndTime || null,
        duration: body.duration || 30,
        appointmentTypeId,
        departmentId: body.departmentId || existing.preferredDepartmentId,
        providerId: body.providerId,
        visitReason: body.visitReason || existing.reason || 'Waitlist booking',
        notes: body.notes || existing.notes,
        status: 'Scheduled',
      },
      user,
    );

    const updated = await prisma.waitlistEntry.update({
      where: { id },
      data: {
        status: 'Booked',
        bookedAppointmentId: created.id,
        closedAt: new Date(),
        closedReason: 'Booked from waitlist',
        offeredAt: null,
        offerExpiresAt: null,
        updatedBy: user?.id || null,
      },
      include: includeRelations,
    });

    await recordEvent(id, {
      action: 'booked',
      summary: `Booked appointment ${created.encounterNumber}`,
      meta: {
        appointmentId: created.id,
        encounterNumber: created.encounterNumber,
        appointmentDate: body.appointmentDate,
        appointmentTime: body.appointmentTime,
      },
      user,
    });

    return { entry: updated, appointment: created };
  },

  async acceptOffer(id, body, user) {
    const existing = await this.findById(id);
    if (!existing) throw httpError('Waitlist entry not found', 404);
    if (existing.status !== 'Offered') {
      throw httpError('No active offer to accept');
    }
    if (!existing.offeredSlotDate || !existing.offeredSlotStart || !existing.offeredProviderId) {
      throw httpError('Offer is incomplete');
    }
    if (existing.offerExpiresAt && new Date(existing.offerExpiresAt) < new Date()) {
      await prisma.waitlistEntry.update({
        where: { id },
        data: {
          status: 'Expired',
          closedAt: new Date(),
          closedReason: 'Offer expired',
          updatedBy: user?.id || null,
        },
      });
      await recordEvent(id, {
        action: 'expired',
        summary: 'Offer expired before acceptance',
        user,
      });
      throw httpError('Offer has expired');
    }

    const result = await this.book(
      id,
      {
        providerId: existing.offeredProviderId,
        appointmentDate: existing.offeredSlotDate,
        appointmentTime: existing.offeredSlotStart,
        appointmentEndTime: existing.offeredSlotEnd,
        appointmentTypeId: existing.appointmentTypeId,
        departmentId: existing.preferredDepartmentId,
        visitReason: existing.reason,
        notes: body?.notes || existing.notes,
        duration: body?.duration,
      },
      user,
    );

    await recordEvent(id, {
      action: 'offer_accepted',
      summary: 'Offer accepted and appointment booked',
      user,
    });

    return result;
  },

  async cancel(id, body, user) {
    const existing = await this.findById(id);
    if (!existing) throw httpError('Waitlist entry not found', 404);
    if (CLOSED_STATUSES.includes(existing.status) && existing.status !== 'Declined') {
      throw httpError(`Cannot cancel status "${existing.status}"`);
    }

    const updated = await prisma.waitlistEntry.update({
      where: { id },
      data: {
        status: 'Cancelled',
        closedAt: new Date(),
        closedReason: body.reason || 'Cancelled by staff',
        updatedBy: user?.id || null,
      },
      include: includeRelations,
    });

    await recordEvent(id, {
      action: 'cancelled',
      summary: body.reason || 'Waitlist entry cancelled',
      user,
    });

    return updated;
  },

  async remove(id, body, user) {
    const existing = await this.findById(id);
    if (!existing) throw httpError('Waitlist entry not found', 404);

    const updated = await prisma.waitlistEntry.update({
      where: { id },
      data: {
        status: 'Removed',
        closedAt: new Date(),
        closedReason: body.reason || 'Removed from waitlist',
        updatedBy: user?.id || null,
      },
      include: includeRelations,
    });

    await recordEvent(id, {
      action: 'removed',
      summary: body.reason || 'Removed from waitlist',
      user,
    });

    return updated;
  },

  async expireStaleOffers(user) {
    const now = new Date();
    const stale = await prisma.waitlistEntry.findMany({
      where: {
        status: 'Offered',
        offerExpiresAt: { lt: now },
      },
      select: { id: true },
    });

    for (const row of stale) {
      await prisma.waitlistEntry.update({
        where: { id: row.id },
        data: {
          status: 'Waiting',
          offeredAt: null,
          offerExpiresAt: null,
          offeredSlotDate: null,
          offeredSlotStart: null,
          offeredSlotEnd: null,
          offeredProviderId: null,
          offeredBy: null,
          updatedBy: user?.id || null,
        },
      });
      await recordEvent(row.id, {
        action: 'expired',
        summary: 'Offer expired — returned to waiting',
        user,
      });
    }

    return { expiredCount: stale.length };
  },

  providerName,
};

module.exports = waitlistService;
