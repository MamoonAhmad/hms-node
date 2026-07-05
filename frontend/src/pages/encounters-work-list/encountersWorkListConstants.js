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
  Scheduled: { stripe: 'bg-blue-500', pill: 'bg-blue-50 text-blue-800 border-blue-200' },
  Arrived: { stripe: 'bg-sky-500', pill: 'bg-sky-50 text-sky-800 border-sky-200' },
  'Checked-In': { stripe: 'bg-yellow-500', pill: 'bg-yellow-50 text-yellow-900 border-yellow-200' },
  Roomed: { stripe: 'bg-violet-500', pill: 'bg-violet-50 text-violet-800 border-violet-200' },
  'With Provider': { stripe: 'bg-purple-500', pill: 'bg-purple-50 text-purple-800 border-purple-200' },
  'In Progress': { stripe: 'bg-purple-500', pill: 'bg-purple-50 text-purple-800 border-purple-200' },
  'Provider Out': { stripe: 'bg-indigo-500', pill: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  'Check out': { stripe: 'bg-green-500', pill: 'bg-green-50 text-green-800 border-green-200' },
  Completed: { stripe: 'bg-green-500', pill: 'bg-green-50 text-green-800 border-green-200' },
};
