export const WAITLIST_STATUSES = [
  { value: 'Waiting', label: 'Waiting', color: '#123B5D' },
  { value: 'Offered', label: 'Offered', color: '#b45309' },
  { value: 'Booked', label: 'Booked', color: '#15803d' },
  { value: 'Declined', label: 'Declined', color: '#64748b' },
  { value: 'Expired', label: 'Expired', color: '#94a3b8' },
  { value: 'Cancelled', label: 'Cancelled', color: '#b91c1c' },
  { value: 'Removed', label: 'Removed', color: '#6b7280' },
];

export const WAITLIST_PRIORITIES = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

export const WAITLIST_TIME_WINDOWS = [
  { value: 'any', label: 'Any time' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
];

export const WAITLIST_DAYS = [
  { value: 'Mon', label: 'Mon' },
  { value: 'Tue', label: 'Tue' },
  { value: 'Wed', label: 'Wed' },
  { value: 'Thu', label: 'Thu' },
  { value: 'Fri', label: 'Fri' },
  { value: 'Sat', label: 'Sat' },
  { value: 'Sun', label: 'Sun' },
];

export const ACTIVE_WAITLIST_STATUSES = ['Waiting', 'Offered'];

export function getWaitlistStatusMeta(status) {
  return WAITLIST_STATUSES.find((s) => s.value === status) || {
    value: status,
    label: status || 'Unknown',
    color: '#6b7280',
  };
}

export function formatProviderName(provider) {
  if (!provider) return '—';
  const parts = [provider.lastName, [provider.firstName, provider.middleName].filter(Boolean).join(' ')]
    .filter(Boolean);
  return parts.join(', ') || '—';
}

export function formatPatientName(patient) {
  if (!patient) return '—';
  const parts = [patient.lastName, [patient.firstName, patient.middleName].filter(Boolean).join(' ')]
    .filter(Boolean);
  return parts.join(', ') || '—';
}

export function formatDateValue(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatOfferSlot(entry) {
  if (!entry?.offeredSlotDate || !entry?.offeredSlotStart) return '—';
  const date = formatDateValue(entry.offeredSlotDate);
  const end = entry.offeredSlotEnd ? `–${entry.offeredSlotEnd}` : '';
  return `${date} ${entry.offeredSlotStart}${end}`;
}

export function emptyWaitlistForm() {
  return {
    patientId: '',
    preferredProviderId: '',
    preferredDepartmentId: '',
    appointmentTypeId: '',
    preferredDateFrom: '',
    preferredDateTo: '',
    preferredDays: [],
    preferredTimes: [],
    preferredTimeWindow: 'any',
    priority: 'normal',
    reason: '',
    notes: '',
    contactPhone: '',
    contactEmail: '',
    sourceAppointmentId: '',
  };
}

export function entryToForm(entry) {
  if (!entry) return emptyWaitlistForm();
  return {
    patientId: entry.patientId || '',
    preferredProviderId: entry.preferredProviderId || '',
    preferredDepartmentId: entry.preferredDepartmentId || '',
    appointmentTypeId: entry.appointmentTypeId || '',
    preferredDateFrom: entry.preferredDateFrom
      ? String(entry.preferredDateFrom).slice(0, 10)
      : '',
    preferredDateTo: entry.preferredDateTo ? String(entry.preferredDateTo).slice(0, 10) : '',
    preferredDays: Array.isArray(entry.preferredDays) ? entry.preferredDays : [],
    preferredTimes: Array.isArray(entry.preferredTimes) ? entry.preferredTimes : [],
    preferredTimeWindow: entry.preferredTimeWindow || 'any',
    priority: entry.priority || 'normal',
    reason: entry.reason || '',
    notes: entry.notes || '',
    contactPhone: entry.contactPhone || '',
    contactEmail: entry.contactEmail || '',
    sourceAppointmentId: entry.sourceAppointmentId || '',
  };
}

export function formToPayload(form, { includePatient = true } = {}) {
  const payload = {
    preferredProviderId: form.preferredProviderId || null,
    preferredDepartmentId: form.preferredDepartmentId || null,
    appointmentTypeId: form.appointmentTypeId || null,
    preferredDateFrom: form.preferredDateFrom || null,
    preferredDateTo: form.preferredDateTo || null,
    preferredDays: form.preferredDays?.length ? form.preferredDays : null,
    preferredTimes: form.preferredTimes?.length ? form.preferredTimes : null,
    preferredTimeWindow: form.preferredTimeWindow || 'any',
    priority: form.priority || 'normal',
    reason: form.reason || null,
    notes: form.notes || null,
    contactPhone: form.contactPhone || null,
    contactEmail: form.contactEmail || null,
  };
  if (includePatient) {
    payload.patientId = form.patientId;
    payload.sourceAppointmentId = form.sourceAppointmentId || null;
  }
  return payload;
}

export function formatPreferredTimes(times) {
  if (!Array.isArray(times) || !times.length) return '';
  return times.join(', ');
}
