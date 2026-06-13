export const DAYS_OPTIONS = [
  { value: 'Mon', label: 'Monday' },
  { value: 'Tue', label: 'Tuesday' },
  { value: 'Wed', label: 'Wednesday' },
  { value: 'Thu', label: 'Thursday' },
  { value: 'Fri', label: 'Friday' },
  { value: 'Sat', label: 'Saturday' },
  { value: 'Sun', label: 'Sunday' },
];

export const DAYS_FILTER_OPTIONS = DAYS_OPTIONS.map(({ value, label }) => ({
  value,
  label: value,
}));

export function normalizeAppointmentTypes(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function formatAppointmentTypes(value) {
  const types = normalizeAppointmentTypes(value);
  return types.length ? types.join(', ') : '-';
}

export function formatLocations(value) {
  const list = Array.isArray(value) ? value.filter(Boolean) : [];
  return list.length ? list.join(', ') : '-';
}

export function formatTimeSlot(start, end) {
  if (!start || !end) return '-';
  return `${start} – ${end}`;
}

export function buildSchedulePayload(formData) {
  return {
    providerId: formData.providerId,
    days: formData.days,
    startTime: formData.startTime,
    endTime: formData.endTime,
    slotDuration: Number(formData.slotDuration),
    appointmentTypeIds: formData.appointmentTypeIds,
    maxAppointmentsPerSlot: Number(formData.maxAppointmentsPerSlot),
    overBooking: Number(formData.overBooking) || 0,
    locationIds: formData.locationIds || [],
    effectiveStartDate: formData.effectiveStartDate,
    effectiveEndDate: formData.effectiveEndDate || null,
    endOnEffectiveDate: !!formData.endOnEffectiveDate,
    status: formData.status || 'Active',
    teleconsultationAllowed: !!formData.teleconsultationAllowed,
  };
}

export function scheduleToForm(schedule) {
  if (!schedule) return null;
  return {
    providerId: schedule.providerId,
    specialty: schedule.specialty || '',
    subSpecialty: schedule.subSpecialty || '',
    days: schedule.days || [],
    startTime: schedule.startTime || '09:00',
    endTime: schedule.endTime || '17:00',
    slotDuration: schedule.slotDuration || 30,
    appointmentTypeIds: schedule.appointmentTypeIds || [],
    maxAppointmentsPerSlot: schedule.maxAppointmentsPerSlot ?? 1,
    overBooking: schedule.overBooking ?? 0,
    locationIds: schedule.locationIds || [],
    effectiveStartDate: schedule.effectiveStartDate || '',
    effectiveEndDate: schedule.effectiveEndDate || '',
    endOnEffectiveDate: !!schedule.endOnEffectiveDate,
    status: schedule.status || 'Active',
    teleconsultationAllowed: !!schedule.teleconsultationAllowed,
    providerName: schedule.providerName || '',
  };
}
