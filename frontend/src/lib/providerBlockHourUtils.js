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
