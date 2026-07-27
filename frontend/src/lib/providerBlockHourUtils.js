const DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseLocalDateOnly(dateStr) {
  if (!dateStr) return null;
  const normalized = String(dateStr).split('T')[0];
  const [y, m, d] = normalized.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dayCodeForLocalDate(dateStr) {
  const date = parseLocalDateOnly(dateStr);
  if (!date) return '';
  return DAY_CODES[date.getDay()];
}

function timeToMinutes(time) {
  const [h, m] = (time || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function timeRangesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

export function isBlockActiveOnLocalDate(block, dateStr) {
  if (!block || block.status !== 'Active') return false;
  const day = dayCodeForLocalDate(dateStr);
  if (!(block.days || []).includes(day)) return false;

  const target = parseLocalDateOnly(dateStr)?.getTime();
  if (target == null) return false;

  const start = parseLocalDateOnly(block.effectiveStartDate)?.getTime();
  const end = block.effectiveEndDate
    ? parseLocalDateOnly(block.effectiveEndDate)?.getTime()
    : Number.MAX_SAFE_INTEGER;

  if (start == null) return false;
  return target >= start && target <= end;
}

export function getActiveBlockPeriodsForDate(blocks, dateStr) {
  if (!dateStr || !Array.isArray(blocks)) return [];

  return blocks
    .filter((block) => isBlockActiveOnLocalDate(block, dateStr))
    .map((block) => ({
      id: block.id,
      startTime: block.startTime,
      endTime: block.endTime,
      reason: block.reason || 'Blocked',
    }));
}

export function isAppointmentSlotBlocked(periods, startTime, durationMinutes = 30) {
  if (!periods?.length || !startTime) return false;
  const slotStart = timeToMinutes(startTime);
  const slotEnd = slotStart + durationMinutes;
  return periods.some((period) =>
    timeRangesOverlap(
      slotStart,
      slotEnd,
      timeToMinutes(period.startTime),
      timeToMinutes(period.endTime),
    ),
  );
}

export function getBlockPeriodPosition(
  startTime,
  endTime,
  { startHour = 5, hourHeight = 80 } = {},
) {
  const startMinutes = timeToMinutes(startTime) - startHour * 60;
  const endMinutes = timeToMinutes(endTime) - startHour * 60;
  const top = (startMinutes / 60) * hourHeight;
  const height = ((endMinutes - startMinutes) / 60) * hourHeight;
  return { top, height };
}

export function formatTimeSlot(start, end) {
  if (!start || !end) return '-';
  return `${start} – ${end}`;
}

export function formatDateRange(start, end) {
  if (!start && !end) return '-';
  if (start && !end) return `${start} → (no end)`;
  if (!start && end) return `(no start) → ${end}`;
  return `${start} → ${end}`;
}

export function buildBlockPayload(formData) {
  return {
    providerId: formData.providerId,
    days: formData.days,
    startTime: formData.startTime,
    endTime: formData.endTime,
    effectiveStartDate: formData.effectiveStartDate,
    effectiveEndDate: formData.effectiveEndDate || null,
    reason: String(formData.reason || '').trim(),
    status: formData.status || 'Active',
  };
}

export function blockToForm(block) {
  if (!block) return null;
  return {
    providerId: block.providerId,
    days: block.days || [],
    startTime: block.startTime || '09:00',
    endTime: block.endTime || '10:00',
    effectiveStartDate: block.effectiveStartDate || '',
    effectiveEndDate: block.effectiveEndDate || '',
    reason: block.reason || '',
    status: block.status || 'Active',
    providerName: block.providerName || '',
  };
}
