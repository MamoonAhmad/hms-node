export const MIN_ORDER_SEARCH_LENGTH = 2;

export const ORDER_STATUSES = [
  'Draft',
  'Scheduled',
  'Ordered',
  'In Progress',
  'Completed',
  'Cancelled',
  'Discontinued',
];

export const ORDER_CATEGORIES = [
  'Lab',
  'Imaging',
  'Procedure',
  'Medication',
  'Referral',
  'Other',
];

export const CATEGORY_DISPLAY_ORDER = [
  'Lab',
  'Imaging',
  'Procedure',
  'Medication',
  'Referral',
  'Other',
  'Radiology',
  'Pharmacy',
  'Procedures',
];

export const CATEGORY_HEADING_LABELS = {
  Lab: 'Lab',
  Imaging: 'Imaging',
  Procedure: 'Procedure',
  Medication: 'Medication',
  Referral: 'Referral',
  Other: 'Other',
  Radiology: 'Imaging',
  Pharmacy: 'Medication',
  Procedures: 'Procedure',
};

export const CATEGORY_DIVIDER_CLASSES = {
  Lab: 'border-green-500',
  Imaging: 'border-primary',
  Procedure: 'border-orange-500',
  Medication: 'border-purple-500',
  Referral: 'border-blue-500',
  Other: 'border-muted-foreground',
  Radiology: 'border-primary',
  Pharmacy: 'border-purple-500',
  Procedures: 'border-orange-500',
};

export const CATEGORY_TAG_CLASSES = {
  Lab: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
  Imaging: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30 dark:border-primary/50',
  Procedure: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  Medication: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  Referral: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Other: 'bg-muted text-muted-foreground',
  Radiology: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30 dark:border-primary/50',
  Pharmacy: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  Procedures: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
};

export const DEFAULT_ORDER_SITES = [
  { id: 'main-lab', name: 'Main Lab' },
  { id: 'inhouse-lab', name: 'In-house Lab' },
  { id: 'external-lab', name: 'External Lab' },
  { id: 'radiology-center', name: 'Radiology Center' },
  { id: 'outpatient-facility', name: 'Outpatient Facility' },
];

export const SITE_PLACEHOLDER = 'select';

export const NON_EDITABLE_STATUSES = ['Completed', 'Cancelled', 'Discontinued'];

export function normalizeCategory(category) {
  const map = {
    Radiology: 'Imaging',
    Pharmacy: 'Medication',
    Procedures: 'Procedure',
  };
  return map[category] || category || 'Other';
}

export function orderRowKey(order) {
  const code = order.procedure?.code || order.procedure?.procedureCode || '';
  const name = order.procedure?.name || order.procedure?.procedureName || '';
  return `${code}::${name}`.toLowerCase();
}

export function formatOrderDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function toDatetimeLocalValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}
