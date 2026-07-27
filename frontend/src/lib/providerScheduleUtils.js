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

export const BREAK_APPLIES_TO_OPTIONS = [
  { value: 'single', label: 'Single Day' },
  { value: 'multiple', label: 'Multiple Days' },
  { value: 'all', label: 'All Days' },
];

export function normalizeAppointmentTypes(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** Keep only appointment type IDs that are still active/selectable in the form. */
export function filterActiveAppointmentTypeIds(appointmentTypeIds, activeTypeOptions = []) {
  const activeIds = new Set((activeTypeOptions || []).map((opt) => opt.value));
  const requested = (appointmentTypeIds || []).filter(Boolean);
  const filtered = requested.filter((id) => activeIds.has(id));
  return {
    appointmentTypeIds: filtered,
    removedInactiveCount: requested.length - filtered.length,
  };
}

export function formatAppointmentTypes(value) {
  const types = normalizeAppointmentTypes(value);
  return types.length ? types.join(', ') : '-';
}

export function formatLocations(value) {
  const list = Array.isArray(value) ? value.filter(Boolean) : [];
  return list.length ? list.join(', ') : '-';
}

/** Schedule department, falling back to all departments assigned to the provider. */
export function formatScheduleDepartments(schedule) {
  if (schedule?.departmentName) return schedule.departmentName;
  const names = (schedule?.providerDepartments || [])
    .map((d) => d.name || d.departmentName)
    .filter(Boolean);
  return names.length ? names.join(', ') : '-';
}

export function resolveDefaultDepartmentId(schedule, provider) {
  if (schedule?.departmentId) return schedule.departmentId;
  const options = getProviderDepartmentOptions(provider);
  if (options.length) return options[0].value;
  return schedule?.providerDepartments?.[0]?.id || '';
}

export function formatTimeSlot(start, end) {
  if (!start || !end) return '-';
  return `${start} – ${end}`;
}

export function formatBreakHours(schedule) {
  if (!schedule?.breakHoursEnabled || !schedule.breakStartTime || !schedule.breakEndTime) {
    return '-';
  }
  const appliesTo = schedule.breakAppliesTo || 'all';
  const days =
    appliesTo === 'all'
      ? 'All schedule days'
      : (schedule.breakDays || []).join(', ') || '-';
  return `${schedule.breakStartTime} – ${schedule.breakEndTime} (${days})`;
}

export function buildSchedulePayload(formData) {
  const breakHoursEnabled = !!formData.breakHoursEnabled;
  const days = Array.isArray(formData.days)
    ? formData.days.filter(Boolean)
    : typeof formData.days === 'string' && formData.days.trim()
      ? formData.days.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  return {
    providerId: formData.providerId,
    departmentId: formData.departmentId,
    days,
    startTime: formData.startTime,
    endTime: formData.endTime,
    slotDuration: Number(formData.slotDuration),
    appointmentTypeIds: formData.appointmentTypeIds,
    maxAppointmentsPerSlot: Number(formData.maxAppointmentsPerSlot),
    overBooking: Number(formData.overBooking) || 0,
    locationIds: formData.locationIds || [],
    breakHoursEnabled,
    breakStartTime: breakHoursEnabled ? formData.breakStartTime : null,
    breakEndTime: breakHoursEnabled ? formData.breakEndTime : null,
    breakAppliesTo: breakHoursEnabled ? formData.breakAppliesTo : null,
    breakDays:
      breakHoursEnabled && formData.breakAppliesTo !== 'all'
        ? formData.breakDays || []
        : [],
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
    departmentId: schedule.departmentId || '',
    departmentName: schedule.departmentName || '',
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
    breakHoursEnabled: !!schedule.breakHoursEnabled,
    breakStartTime: schedule.breakStartTime || '12:00',
    breakEndTime: schedule.breakEndTime || '13:00',
    breakAppliesTo: schedule.breakAppliesTo || 'all',
    breakDays: schedule.breakDays || [],
    effectiveStartDate: schedule.effectiveStartDate || '',
    effectiveEndDate: schedule.effectiveEndDate || '',
    endOnEffectiveDate: !!schedule.endOnEffectiveDate,
    status: schedule.status || 'Active',
    teleconsultationAllowed: !!schedule.teleconsultationAllowed,
    providerName: schedule.providerName || '',
    providerDepartments: schedule.providerDepartments || [],
  };
}

export function getProviderDepartmentOptions(provider) {
  if (!provider) return [];
  const departments = provider.departments?.length
    ? provider.departments
    : provider.department
      ? [provider.department]
      : [];
  const options = departments.map((d) => ({
    value: d.id,
    label: d.departmentCode ? `${d.departmentName} (${d.departmentCode})` : d.departmentName,
  }));
  // Prefer the provider's primary departmentId as the first (auto-selected) option
  const primaryId = provider.departmentId || provider.department?.id;
  if (!primaryId || options.length < 2) return options;
  const primary = options.find((o) => o.value === primaryId);
  if (!primary) return options;
  return [primary, ...options.filter((o) => o.value !== primaryId)];
}
