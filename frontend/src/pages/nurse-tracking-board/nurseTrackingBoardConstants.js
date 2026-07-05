export const TRACKING_INDICATORS = [
  { key: 'total', countKey: 'total', label: 'Total patients', filterKey: null },
  { key: 'scheduled', countKey: 'scheduled', label: 'Scheduled', filterKey: 'scheduled' },
  { key: 'arrived', countKey: 'arrived', label: 'Arrived', filterKey: 'arrived' },
  {
    key: 'registrationIncomplete',
    countKey: 'registrationIncomplete',
    label: 'Registration incomplete',
    filterKey: 'registrationIncomplete',
  },
  { key: 'roomed', countKey: 'roomed', label: 'Roomed', filterKey: 'roomed' },
  { key: 'withProvider', countKey: 'withProvider', label: 'With Provider', filterKey: 'withProvider' },
  { key: 'providerOut', countKey: 'providerOut', label: 'Provider Out', filterKey: 'providerOut' },
  { key: 'checkout', countKey: 'checkout', label: 'Check out', filterKey: 'checkout' },
];

export const ARRIVAL_TIME_OPTIONS = [
  { value: 'all', label: 'All arrival times' },
  { value: 'morning', label: 'Morning (before 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM+)' },
  { value: 'not_arrived', label: 'Not yet arrived' },
];

export const STATUS_CHIP_COLORS = {
  Scheduled: { stripe: 'bg-blue-500', pill: 'bg-blue-50 text-blue-800 border-blue-200' },
  Rescheduled: { stripe: 'bg-orange-500', pill: 'bg-orange-50 text-orange-800 border-orange-200' },
  Arrived: { stripe: 'bg-sky-500', pill: 'bg-sky-50 text-sky-800 border-sky-200' },
  'Checked-In': { stripe: 'bg-yellow-500', pill: 'bg-yellow-50 text-yellow-900 border-yellow-200' },
  'Registration Incomplete': {
    stripe: 'bg-orange-500',
    pill: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  Roomed: { stripe: 'bg-violet-500', pill: 'bg-violet-50 text-violet-800 border-violet-200' },
  'With Provider': { stripe: 'bg-purple-500', pill: 'bg-purple-50 text-purple-800 border-purple-200' },
  'In Progress': { stripe: 'bg-purple-500', pill: 'bg-purple-50 text-purple-800 border-purple-200' },
  'Provider Out': { stripe: 'bg-indigo-500', pill: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  'Check out': { stripe: 'bg-green-500', pill: 'bg-green-50 text-green-800 border-green-200' },
  Completed: { stripe: 'bg-green-500', pill: 'bg-green-50 text-green-800 border-green-200' },
};

export function formatAppointmentDate(iso) {
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

export function formatWaitingTime(minutes) {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatLastUpdated(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
