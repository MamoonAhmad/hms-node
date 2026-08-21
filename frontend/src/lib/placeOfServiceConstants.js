export const POS_CATEGORIES = [
  { value: 'facility', label: 'Facility' },
  { value: 'office_clinic', label: 'Office / Clinic' },
  { value: 'home_community', label: 'Home / Community' },
  { value: 'telehealth', label: 'Telehealth' },
  { value: 'skilled_long_term', label: 'Skilled / Long-term' },
  { value: 'other', label: 'Other' },
];

export function getPosCategoryLabel(value) {
  return POS_CATEGORIES.find((c) => c.value === value)?.label || value || '—';
}

export function normalizePosCode(code) {
  const raw = String(code || '').trim();
  if (!raw) return '';
  const leading = raw.split(/[\s-–]/)[0].replace(/\D/g, '');
  if (!leading) return '';
  return leading.padStart(2, '0').slice(0, 2);
}

export function formatPosLabel(row) {
  if (!row) return '';
  const code = normalizePosCode(typeof row === 'string' ? row : row.code);
  if (!code) return '';
  const name = typeof row === 'string' ? '' : row.name || row.description || '';
  return name ? `${code} — ${name}` : code;
}

export const emptyPlaceOfServiceForm = () => ({
  code: '',
  name: '',
  description: '',
  category: '',
  cmsStandard: false,
  isActive: true,
  isBillable: true,
  isDefault: false,
  effectiveDate: '',
  expiryDate: '',
  sortOrder: '',
  codingNotes: '',
});
