const prisma = require('../lib/prisma');

const DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NOT_DELETED_SCHEDULE = { deletedAt: null };
const NOT_DELETED_BLOCK = { deletedAt: null };
const GENERAL_TYPE_NAME = 'general';

function timeToMinutes(t) {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Format minutes-from-midnight as "9:00 AM" / "12:30 PM". */
function formatTime12h(minutes) {
  const total = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  let h = Math.floor(total / 60);
  const min = total % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(min).padStart(2, '0')} ${period}`;
}

function formatSlotLabel(startMin, endMin) {
  return `${formatTime12h(startMin)} - ${formatTime12h(endMin)}`;
}

function formatDateOnly(date) {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateOnly(value) {
  const d = new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayCodeForDate(dateStr) {
  const d = parseDateOnly(dateStr);
  return DAY_CODES[d.getUTCDay()];
}

function isGeneralAppointmentTypeName(name) {
  return String(name || '').trim().toLowerCase() === GENERAL_TYPE_NAME;
}

function isScheduleActiveOnDate(schedule, dateStr) {
  if (schedule.status !== 'Active') return false;
  const day = dayCodeForDate(dateStr);
  if (!(schedule.days || []).includes(day)) return false;
  const d = parseDateOnly(dateStr).getTime();
  const start = parseDateOnly(schedule.effectiveStartDate).getTime();
  const end = schedule.effectiveEndDate
    ? parseDateOnly(schedule.effectiveEndDate).getTime()
    : Number.MAX_SAFE_INTEGER;
  return d >= start && d <= end;
}

function isBlockActiveOnDate(block, dateStr) {
  if (block.status !== 'Active') return false;
  const day = dayCodeForDate(dateStr);
  if (!(block.days || []).includes(day)) return false;
  const d = parseDateOnly(dateStr).getTime();
  const start = parseDateOnly(block.effectiveStartDate).getTime();
  const end = block.effectiveEndDate
    ? parseDateOnly(block.effectiveEndDate).getTime()
    : Number.MAX_SAFE_INTEGER;
  return d >= start && d <= end;
}

function timeRangesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

function isTimeBlocked(blocks, dateStr, slotStart, slotEnd) {
  return blocks.some((block) => {
    if (!isBlockActiveOnDate(block, dateStr)) return false;
    const bStart = timeToMinutes(block.startTime);
    const bEnd = timeToMinutes(block.endTime);
    return timeRangesOverlap(slotStart, slotEnd, bStart, bEnd);
  });
}

function isScheduleBreakBlocked(schedule, dateStr, slotStart, slotEnd) {
  if (!schedule?.breakHoursEnabled || !schedule.breakStartTime || !schedule.breakEndTime) {
    return false;
  }

  const day = dayCodeForDate(dateStr);
  const breakDays =
    schedule.breakAppliesTo === 'all'
      ? schedule.days || []
      : schedule.breakDays || [];

  if (!breakDays.includes(day)) return false;

  const bStart = timeToMinutes(schedule.breakStartTime);
  const bEnd = timeToMinutes(schedule.breakEndTime);
  return timeRangesOverlap(slotStart, slotEnd, bStart, bEnd);
}

function isSlotBlocked(blocks, schedules, dateStr, slotStart, slotEnd) {
  if (isTimeBlocked(blocks, dateStr, slotStart, slotEnd)) return true;
  return schedules.some((schedule) => isScheduleBreakBlocked(schedule, dateStr, slotStart, slotEnd));
}

function collectBreakPeriods(schedules, dateStr) {
  const day = dayCodeForDate(dateStr);
  const periods = [];

  for (const schedule of schedules) {
    if (!schedule?.breakHoursEnabled || !schedule.breakStartTime || !schedule.breakEndTime) continue;
    const breakDays =
      schedule.breakAppliesTo === 'all'
        ? schedule.days || []
        : schedule.breakDays || [];
    if (!breakDays.includes(day)) continue;
    periods.push({
      startTime: schedule.breakStartTime,
      endTime: schedule.breakEndTime,
      type: 'break',
      scheduleId: schedule.id,
      departmentId: schedule.departmentId || null,
    });
  }

  return periods;
}

async function resolveAppointmentTypeMeta(appointmentTypeName) {
  if (!appointmentTypeName || !String(appointmentTypeName).trim()) {
    return { name: null, defaultTime: null, isGeneral: false, isSystem: false };
  }

  const normalized = String(appointmentTypeName).trim();
  const row = await prisma.appointmentType.findFirst({
    where: {
      deletedAt: null,
      isActive: true,
      name: { equals: normalized, mode: 'insensitive' },
    },
    select: { id: true, name: true, defaultTime: true, isSystem: true, providerRequired: true },
  });

  if (!row) {
    return {
      name: normalized,
      defaultTime: null,
      isGeneral: isGeneralAppointmentTypeName(normalized),
      isSystem: false,
    };
  }

  return {
    id: row.id,
    name: row.name,
    defaultTime: row.defaultTime,
    isGeneral: isGeneralAppointmentTypeName(row.name),
    isSystem: row.isSystem === true,
    providerRequired: row.providerRequired === true,
  };
}

/**
 * Slot step in minutes: appointment type duration when provided, else schedule slotDuration.
 */
function resolveSlotStepMinutes(schedule, appointmentTypeDuration) {
  const typeDuration = Number(appointmentTypeDuration);
  if (Number.isFinite(typeDuration) && typeDuration >= 5) {
    return Math.round(typeDuration);
  }
  const scheduleDuration = Number(schedule?.slotDuration);
  if (Number.isFinite(scheduleDuration) && scheduleDuration >= 5) return scheduleDuration;
  return 30;
}

async function getMatchingSchedules(
  providerId,
  dateStr,
  appointmentTypeName,
  departmentId,
  typeMetaOverride = null,
) {
  let providerDepartmentIds = null;
  if (departmentId) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: { departmentLinks: { select: { departmentId: true } } },
    });
    providerDepartmentIds = new Set(
      (provider?.departmentLinks || []).map((link) => link.departmentId),
    );
    if (provider?.departmentId) providerDepartmentIds.add(provider.departmentId);
  }

  const typeMeta = typeMetaOverride || (await resolveAppointmentTypeMeta(appointmentTypeName));
  // General is available for every provider schedule (not limited by schedule type links).
  const skipTypeFilter = !appointmentTypeName || typeMeta.isGeneral;

  const schedules = await prisma.providerSchedule.findMany({
    where: {
      ...NOT_DELETED_SCHEDULE,
      providerId,
      status: 'Active',
      ...(departmentId
        ? {
            OR: [{ departmentId }, { departmentId: null }],
          }
        : {}),
    },
    include: {
      appointmentTypes: {
        include: {
          appointmentType: { select: { name: true, isActive: true, deletedAt: true } },
        },
      },
    },
  });

  return schedules.filter((schedule) => {
    if (!isScheduleActiveOnDate(schedule, dateStr)) return false;

    if (departmentId) {
      if (schedule.departmentId && schedule.departmentId !== departmentId) return false;
      if (!schedule.departmentId && !providerDepartmentIds?.has(departmentId)) return false;
    }

    if (skipTypeFilter) return true;

    const typeNames = (schedule.appointmentTypes || [])
      .map((t) => t.appointmentType)
      .filter((t) => t && !t.deletedAt && t.isActive)
      .map((t) => t.name);
    if (!typeNames.length) return true;
    const normalizedType = appointmentTypeName.trim().toLowerCase();
    return typeNames.some((name) => name.trim().toLowerCase() === normalizedType);
  });
}

function generateSlotsFromSchedule(schedule, appointmentTypeDuration) {
  const start = timeToMinutes(schedule.startTime);
  const end = timeToMinutes(schedule.endTime);
  const step = resolveSlotStepMinutes(schedule, appointmentTypeDuration);
  const slots = [];
  for (let t = start; t + step <= end; t += step) {
    slots.push({
      start: t,
      end: t + step,
      startTime: minutesToTime(t),
      endTime: minutesToTime(t + step),
      maxAppointmentsPerSlot: schedule.maxAppointmentsPerSlot || 1,
      overBooking: schedule.overBooking || 0,
      slotDuration: step,
    });
  }
  return slots;
}

async function getBookedAppointmentsForDay(providerId, dateStr, excludeAppointmentId) {
  const date = parseDateOnly(dateStr);
  return prisma.appointment.findMany({
    where: {
      providerId,
      appointmentDate: date,
      status: { notIn: ['Cancelled', 'No Show', 'No-Show', 'Deleted'] },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { appointmentTime: true, duration: true, appointmentEndTime: true },
  });
}

function countOverlappingBookings(appointments, slotStart, slotEnd) {
  return appointments.filter((apt) => {
    const aptStart = timeToMinutes(apt.appointmentTime);
    let aptEnd = apt.appointmentEndTime
      ? timeToMinutes(apt.appointmentEndTime)
      : aptStart + (apt.duration || 30);
    if (aptEnd <= aptStart) aptEnd = aptStart + (apt.duration || 30);
    return timeRangesOverlap(slotStart, slotEnd, aptStart, aptEnd);
  }).length;
}

function collectUnblockedSlotsForDay(schedules, blocks, dateStr, appointmentTypeDuration) {
  if (!schedules.length) return [];

  const slotMap = new Map();
  for (const schedule of schedules) {
    const slots = generateSlotsFromSchedule(schedule, appointmentTypeDuration);
    for (const slot of slots) {
      if (isSlotBlocked(blocks, schedules, dateStr, slot.start, slot.end)) continue;
      const capacity = slot.maxAppointmentsPerSlot + slot.overBooking;
      if (capacity <= 0) continue;
      const key = slot.startTime;
      const existing = slotMap.get(key);
      if (!existing || capacity > existing.capacity) {
        slotMap.set(key, {
          ...slot,
          capacity,
        });
      }
    }
  }

  return [...slotMap.values()];
}

async function collectAvailableSlotsForDay(
  providerId,
  dateStr,
  schedules,
  blocks,
  { excludeAppointmentId, appointmentTypeDuration } = {},
) {
  const slotMap = new Map();
  for (const slot of collectUnblockedSlotsForDay(
    schedules,
    blocks,
    dateStr,
    appointmentTypeDuration,
  )) {
    slotMap.set(slot.startTime, slot);
  }

  const bookedAppointments = await getBookedAppointmentsForDay(
    providerId,
    dateStr,
    excludeAppointmentId,
  );

  const available = [];
  for (const slot of slotMap.values()) {
    const booked = countOverlappingBookings(bookedAppointments, slot.start, slot.end);
    const remaining = slot.capacity - booked;
    if (remaining > 0) {
      available.push({ ...slot, remaining, capacity: slot.capacity });
    }
  }

  available.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return available;
}

const appointmentAvailabilityService = {
  async getAvailableDates(providerId, { appointmentType, departmentId, fromDate, daysAhead = 90 } = {}) {
    if (!providerId) {
      const err = new Error('Provider is required');
      err.statusCode = 400;
      throw err;
    }

    const typeMeta = await resolveAppointmentTypeMeta(appointmentType);
    const appointmentTypeDuration = typeMeta.isGeneral ? null : typeMeta.defaultTime;

    const start = fromDate ? parseDateOnly(fromDate) : parseDateOnly(new Date());
    const dates = [];
    const blocks = await prisma.providerBlockHour.findMany({
      where: { ...NOT_DELETED_BLOCK, providerId, status: 'Active' },
    });

    for (let i = 0; i < daysAhead; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const dateStr = formatDateOnly(d);
      const schedules = await getMatchingSchedules(
        providerId,
        dateStr,
        appointmentType,
        departmentId,
        typeMeta,
      );
      if (!schedules.length) continue;

      const unblockedSlots = collectUnblockedSlotsForDay(
        schedules,
        blocks,
        dateStr,
        appointmentTypeDuration,
      );
      if (unblockedSlots.length) dates.push(dateStr);
    }

    return { dates };
  },

  async getAvailableSlots(
    providerId,
    dateStr,
    { appointmentType, departmentId, excludeAppointmentId } = {},
  ) {
    if (!providerId || !dateStr) {
      const err = new Error('Provider and date are required');
      err.statusCode = 400;
      throw err;
    }

    const typeMeta = await resolveAppointmentTypeMeta(appointmentType);

    // General uses a free time picker on the client — do not return predefined slots.
    if (typeMeta.isGeneral) {
      const schedules = await getMatchingSchedules(
        providerId,
        dateStr,
        appointmentType,
        departmentId,
        typeMeta,
      );
      if (!schedules.length) {
        return { slots: [], scheduleWindow: null, breakPeriods: [], slotDuration: null };
      }

      const breakPeriods = collectBreakPeriods(schedules, dateStr);
      let windowStart = Infinity;
      let windowEnd = -Infinity;
      for (const schedule of schedules) {
        windowStart = Math.min(windowStart, timeToMinutes(schedule.startTime));
        windowEnd = Math.max(windowEnd, timeToMinutes(schedule.endTime));
      }

      return {
        slots: [],
        breakPeriods,
        scheduleWindow:
          windowStart < Infinity
            ? { startTime: minutesToTime(windowStart), endTime: minutesToTime(windowEnd) }
            : null,
        slotDuration: null,
        useTimePicker: true,
      };
    }

    const appointmentTypeDuration = typeMeta.defaultTime;
    const schedules = await getMatchingSchedules(
      providerId,
      dateStr,
      appointmentType,
      departmentId,
      typeMeta,
    );
    if (!schedules.length) return { slots: [], scheduleWindow: null, breakPeriods: [] };

    const blocks = await prisma.providerBlockHour.findMany({
      where: { ...NOT_DELETED_BLOCK, providerId, status: 'Active' },
    });
    const breakPeriods = collectBreakPeriods(schedules, dateStr);

    const availableSlots = await collectAvailableSlotsForDay(
      providerId,
      dateStr,
      schedules,
      blocks,
      { excludeAppointmentId, appointmentTypeDuration },
    );

    let windowStart = Infinity;
    let windowEnd = -Infinity;
    for (const schedule of schedules) {
      windowStart = Math.min(windowStart, timeToMinutes(schedule.startTime));
      windowEnd = Math.max(windowEnd, timeToMinutes(schedule.endTime));
    }

    const effectiveDuration =
      Number.isFinite(Number(appointmentTypeDuration)) && Number(appointmentTypeDuration) >= 5
        ? Math.round(Number(appointmentTypeDuration))
        : resolveSlotStepMinutes(schedules[0], null);

    const slots = availableSlots.map((slot) => ({
      value: slot.startTime,
      label: formatSlotLabel(slot.start, slot.end),
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.end - slot.start,
      remaining: slot.remaining,
      capacity: slot.capacity,
    }));

    return {
      slots,
      breakPeriods,
      scheduleWindow:
        windowStart < Infinity
          ? { startTime: minutesToTime(windowStart), endTime: minutesToTime(windowEnd) }
          : null,
      slotDuration: effectiveDuration,
      useTimePicker: false,
    };
  },

  async assertBookingAllowed({
    providerId,
    departmentId,
    appointmentDate,
    appointmentTime,
    appointmentEndTime,
    duration,
    excludeAppointmentId,
    appointmentType,
  }) {
    if (!providerId) return;

    const dateStr =
      typeof appointmentDate === 'string'
        ? appointmentDate.split('T')[0]
        : formatDateOnly(appointmentDate);

    const startMin = timeToMinutes(appointmentTime);
    let endMin = appointmentEndTime
      ? timeToMinutes(appointmentEndTime)
      : startMin + (duration || 30);
    if (endMin <= startMin) endMin = startMin + (duration || 30);

    const schedules = await getMatchingSchedules(
      providerId,
      dateStr,
      appointmentType || null,
      departmentId,
    );
    const matchingSchedule = schedules.find((schedule) => {
      const sStart = timeToMinutes(schedule.startTime);
      const sEnd = timeToMinutes(schedule.endTime);
      return sStart <= startMin && sEnd >= endMin;
    });

    if (!matchingSchedule) {
      const err = new Error('Selected time is outside the provider\'s scheduled availability');
      err.statusCode = 400;
      throw err;
    }

    const blocks = await prisma.providerBlockHour.findMany({
      where: { ...NOT_DELETED_BLOCK, providerId, status: 'Active' },
    });
    if (isSlotBlocked(blocks, schedules, dateStr, startMin, endMin)) {
      const err = new Error('Selected time falls within blocked or break hours for this provider');
      err.statusCode = 400;
      throw err;
    }

    const capacity =
      (matchingSchedule.maxAppointmentsPerSlot || 1) + (matchingSchedule.overBooking || 0);
    const bookedAppointments = await getBookedAppointmentsForDay(
      providerId,
      dateStr,
      excludeAppointmentId,
    );
    const booked = countOverlappingBookings(bookedAppointments, startMin, endMin);

    if (booked >= capacity) {
      const err = new Error('This time slot is fully booked for the selected provider');
      err.statusCode = 409;
      throw err;
    }
  },
};

module.exports = appointmentAvailabilityService;
