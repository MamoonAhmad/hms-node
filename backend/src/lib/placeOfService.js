const POS_CATEGORIES = [
  { value: 'facility', label: 'Facility' },
  { value: 'office_clinic', label: 'Office / Clinic' },
  { value: 'home_community', label: 'Home / Community' },
  { value: 'telehealth', label: 'Telehealth' },
  { value: 'skilled_long_term', label: 'Skilled / Long-term' },
  { value: 'other', label: 'Other' },
];

const CMS_POS_SEED = [
  { code: '02', name: 'Telehealth (not home)', description: 'Telehealth Provided Other than in Patient\'s Home', category: 'telehealth', sortOrder: 2 },
  { code: '10', name: 'Telehealth (patient home)', description: 'Telehealth Provided in Patient\'s Home', category: 'telehealth', sortOrder: 10 },
  { code: '11', name: 'Office', description: 'Office', category: 'office_clinic', sortOrder: 11, isDefault: true },
  { code: '12', name: 'Home', description: 'Home', category: 'home_community', sortOrder: 12 },
  { code: '13', name: 'Assisted living', description: 'Assisted Living Facility', category: 'home_community', sortOrder: 13 },
  { code: '14', name: 'Group home', description: 'Group Home', category: 'home_community', sortOrder: 14 },
  { code: '15', name: 'Mobile unit', description: 'Mobile Unit', category: 'home_community', sortOrder: 15 },
  { code: '19', name: 'Off-campus outpatient', description: 'Off Campus-Outpatient Hospital', category: 'facility', sortOrder: 19 },
  { code: '20', name: 'Urgent care', description: 'Urgent Care Facility', category: 'office_clinic', sortOrder: 20 },
  { code: '21', name: 'Inpatient hospital', description: 'Inpatient Hospital', category: 'facility', sortOrder: 21 },
  { code: '22', name: 'Outpatient hospital', description: 'On Campus-Outpatient Hospital', category: 'facility', sortOrder: 22 },
  { code: '23', name: 'Emergency room', description: 'Emergency Room – Hospital', category: 'facility', sortOrder: 23 },
  { code: '24', name: 'Ambulatory surgical center', description: 'Ambulatory Surgical Center', category: 'facility', sortOrder: 24 },
  { code: '31', name: 'Skilled nursing facility', description: 'Skilled Nursing Facility', category: 'skilled_long_term', sortOrder: 31 },
  { code: '32', name: 'Nursing facility', description: 'Nursing Facility', category: 'skilled_long_term', sortOrder: 32 },
  { code: '41', name: 'Ambulance (land)', description: 'Ambulance – Land', category: 'other', sortOrder: 41 },
  { code: '49', name: 'Independent clinic', description: 'Independent Clinic', category: 'office_clinic', sortOrder: 49 },
  { code: '50', name: 'FQHC', description: 'Federally Qualified Health Center', category: 'office_clinic', sortOrder: 50 },
  { code: '71', name: 'Public health clinic', description: 'Public Health Clinic', category: 'office_clinic', sortOrder: 71 },
  { code: '81', name: 'Independent laboratory', description: 'Independent Laboratory', category: 'other', sortOrder: 81 },
  { code: '99', name: 'Other', description: 'Other Place of Service', category: 'other', sortOrder: 99 },
];

function normalizePosCode(code) {
  const raw = String(code || '').trim();
  if (!raw) return '';
  const leading = raw.split(/[\s-–]/)[0].replace(/\D/g, '');
  if (!leading) return '';
  return leading.padStart(2, '0').slice(0, 2);
}

function isValidPosCode(code) {
  const normalized = normalizePosCode(code);
  if (!normalized || !/^\d{2}$/.test(normalized)) return false;
  const n = parseInt(normalized, 10);
  return n >= 1 && n <= 99;
}

function formatPosLabel(row) {
  if (!row) return '';
  const code = normalizePosCode(row.code || row);
  const name = row.name || row.description || '';
  return name ? `${code} — ${name}` : code;
}

module.exports = {
  POS_CATEGORIES,
  CMS_POS_SEED,
  normalizePosCode,
  isValidPosCode,
  formatPosLabel,
};
