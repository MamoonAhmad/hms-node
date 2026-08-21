const prisma = require('../lib/prisma');

const DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NOT_DELETED_SCHEDULE = { deletedAt: null };
const NOT_DELETED_BLOCK = { deletedAt: null };

function timeToMinutes(t) {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
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

async function getMatchingSchedules(providerId, dateStr, appointmentTypeName) {
  const schedules = await prisma.providerSchedule.findMany({
    where: { ...NOT_DELETED_SCHEDULE, providerId, status: 'Active' },
    include: {
      appointmentTypes: { include: { appointmentType: { select: { name: true } } } },
    },
  });

  return schedules.filter((schedule) => {
    if (!isScheduleActiveOnDate(schedule, dateStr)) return false;
    if (!appointmentTypeName) return true;
    const typeNames = (schedule.appointmentTypes || []).map((t) => t.appointmentType?.name);
    if (!typeNames.length) return true;
    return typeNames.includes(appointmentTypeName);
  });
}

function generateSlotsFromSchedule(schedule) {
  const start = timeToMinutes(schedule.startTime);
  const end = timeToMinutes(schedule.endTime);
  const step = schedule.slotDuration || 30;
  const slots = [];
  for (let t = start; t + step <= end; t += step) {
    slots.push({
      start: t,
      end: t + step,
      startTime: minutesToTime(t),
      endTime: minutesToTime(t + step),
      maxAppointmentsPerSlot: schedule.maxAppointmentsPerSlot || 1,
      overBooking: schedule.overBooking || 0,
    });
  }
  return slots;
}

async function countAppointmentsInSlot(providerId, dateStr, slotStart, slotEnd, excludeAppointmentId) {
  const date = parseDateOnly(dateStr);
  const appointments = await prisma.appointment.findMany({
    where: {
      providerId,
      appointmentDate: date,
      status: { notIn: ['Cancelled', 'No Show', 'No-Show', 'Deleted', 'Rescheduled'] },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { appointmentTime: true, duration: true, appointmentEndTime: true },
  });

  return appointments.filter((apt) => {
    const aptStart = timeToMinutes(apt.appointmentTime);
    let aptEnd = apt.appointmentEndTime
      ? timeToMinutes(apt.appointmentEndTime)
      : aptStart + (apt.duration || 30);
    if (aptEnd <= aptStart) aptEnd = aptStart + (apt.duration || 30);
    return timeRangesOverlap(slotStart, slotEnd, aptStart, aptEnd);
  }).length;
}

const appointmentAvailabilityService = {
  async getAvailableDates(providerId, { appointmentType, fromDate, daysAhead = 90 } = {}) {
    if (!providerId) {
      const err = new Error('Provider is required');
      err.statusCode = 400;
      throw err;
    }

    const start = fromDate ? parseDateOnly(fromDate) : parseDateOnly(new Date());
    const dates = [];

    for (let i = 0; i < daysAhead; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const dateStr = formatDateOnly(d);
      const schedules = await getMatchingSchedules(providerId, dateStr, appointmentType);
      if (!schedules.length) continue;

      const blocks = await prisma.providerBlockHour.findMany({
        where: { ...NOT_DELETED_BLOCK, providerId, status: 'Active' },
      });

      const hasOpenSlot = schedules.some((schedule) => {
        const slots = generateSlotsFromSchedule(schedule);
        return slots.some((slot) => {
          if (isTimeBlocked(blocks, dateStr, slot.start, slot.end)) return false;
          const capacity = slot.maxAppointmentsPerSlot + slot.overBooking;
          return capacity > 0;
        });
      });

      if (hasOpenSlot) dates.push(dateStr);
    }

    return { dates };
  },

  async getAvailableSlots(
    providerId,
    dateStr,
    { appointmentType, excludeAppointmentId } = {},
  ) {
    if (!providerId || !dateStr) {
      const err = new Error('Provider and date are required');
      err.statusCode = 400;
      throw err;
    }

    const schedules = await getMatchingSchedules(providerId, dateStr, appointmentType);
    if (!schedules.length) return { slots: [], scheduleWindow: null };

    const blocks = await prisma.providerBlockHour.findMany({
      where: { ...NOT_DELETED_BLOCK, providerId, status: 'Active' },
    });

    let windowStart = Infinity;
    let windowEnd = -Infinity;
    const slotMap = new Map();

    for (const schedule of schedules) {
      windowStart = Math.min(windowStart, timeToMinutes(schedule.startTime));
      windowEnd = Math.max(windowEnd, timeToMinutes(schedule.endTime));

      const slots = generateSlotsFromSchedule(schedule);
      for (const slot of slots) {
        if (isTimeBlocked(blocks, dateStr, slot.start, slot.end)) continue;
        const key = slot.startTime;
        const existing = slotMap.get(key);
        const capacity = slot.maxAppointmentsPerSlot + slot.overBooking;
        if (!existing || capacity > existing.capacity) {
          slotMap.set(key, { ...slot, capacity, slotDuration: schedule.slotDuration });
        }
      }
    }

    const slots = [];
    for (const slot of slotMap.values()) {
      const booked = await countAppointmentsInSlot(
        providerId,
        dateStr,
        slot.start,
        slot.end,
        excludeAppointmentId,
      );
      const remaining = slot.capacity - booked;
      if (remaining > 0) {
        slots.push({
          value: slot.startTime,
          label: `${slot.startTime} – ${slot.endTime}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.end - slot.start,
          remaining,
          capacity: slot.capacity,
        });
      }
    }

    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return {
      slots,
      scheduleWindow:
        windowStart < Infinity
          ? { startTime: minutesToTime(windowStart), endTime: minutesToTime(windowEnd) }
          : null,
      slotDuration: schedules[0]?.slotDuration || 30,
    };
  },

  async assertBookingAllowed({
    providerId,
    appointmentDate,
    appointmentTime,
    appointmentEndTime,
    duration,
    excludeAppointmentId,
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

    const schedules = await getMatchingSchedules(providerId, dateStr);
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
    if (isTimeBlocked(blocks, dateStr, startMin, endMin)) {
      const err = new Error('Selected time falls within blocked hours for this provider');
      err.statusCode = 400;
      throw err;
    }

    const capacity =
      (matchingSchedule.maxAppointmentsPerSlot || 1) + (matchingSchedule.overBooking || 0);
    const booked = await countAppointmentsInSlot(
      providerId,
      dateStr,
      startMin,
      endMin,
      excludeAppointmentId,
    );

    if (booked >= capacity) {
      const err = new Error('This time slot is fully booked for the selected provider');
      err.statusCode = 409;
      throw err;
    }
  },
};

module.exports = appointmentAvailabilityService;
