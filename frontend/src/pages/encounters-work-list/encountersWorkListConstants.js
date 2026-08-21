export const WORK_LIST_TABS = [
  { id: 'all', label: 'All patients', countKey: 'all' },
  { id: 'my_patients', label: 'My Patients', countKey: 'my_patients' },
  { id: 'ready_for_intake', label: 'Ready for intake', countKey: 'ready_for_intake' },
  { id: 'ready_for_providers', label: 'Ready for providers', countKey: 'ready_for_providers' },
  { id: 'ready_for_checkout', label: 'Ready for checkout', countKey: 'ready_for_checkout' },
  { id: 'ready_for_coding', label: 'Ready for coding', countKey: 'ready_for_coding' },
];

export const APPOINTMENT_TIME_OPTIONS = [
  { value: 'all', label: 'All appointment times' },
  { value: 'morning', label: 'Morning (before 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM+)' },
];

export const GENDER_OPTIONS = [
  { value: 'all', label: 'All genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export function formatDob(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

export function formatTime12h(time24) {
  if (!time24) return '—';
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatAppointmentDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

export function formatWaitingTime(minutes) {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const STATUS_CHIP_COLORS = {
  Scheduled: { stripe: 'bg-primary', pill: 'bg-primary/10 text-primary border-primary/25' },
  Arrived: { stripe: 'bg-teal-600', pill: 'bg-teal-50 text-teal-900 border-teal-200' },
  'Checked-In': { stripe: 'bg-amber-500', pill: 'bg-amber-50 text-amber-900 border-amber-200' },
  Roomed: { stripe: 'bg-slate-500', pill: 'bg-slate-100 text-slate-800 border-slate-200' },
  'With Provider': { stripe: 'bg-teal-700', pill: 'bg-teal-100 text-teal-900 border-teal-300' },
  'In Progress': { stripe: 'bg-teal-700', pill: 'bg-teal-100 text-teal-900 border-teal-300' },
  'Provider Out': { stripe: 'bg-slate-600', pill: 'bg-slate-50 text-slate-800 border-slate-300' },
  'Check out': { stripe: 'bg-emerald-600', pill: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  Completed: { stripe: 'bg-emerald-600', pill: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};
