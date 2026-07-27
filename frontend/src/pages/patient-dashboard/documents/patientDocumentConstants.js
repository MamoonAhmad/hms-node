export const DOCUMENT_TYPES = [
  'Government ID',
  'Insurance Card',
  'Consent Form',
  'Referral Document',
  'Lab Report',
  'Imaging Report',
  'Pathology Report',
  'Clinical Note',
  'Discharge Summary',
  'Prescription',
  'Medical History',
  'Allergy Document',
  'Prior Authorization',
  'Billing Document',
  'Legal Document',
  'Other',
];

export const DOCUMENT_CATEGORIES = [
  'Registration',
  'Insurance',
  'Consent',
  'Clinical',
  'Referral',
  'Lab',
  'Imaging',
  'Medication',
  'Billing',
  'Administrative',
  'Other',
];

export const DOCUMENT_SOURCES = [
  'Registration',
  'Patient Dashboard',
  'Referral',
  'Consent',
  'Insurance',
  'Lab / Imaging',
];

export const DOCUMENT_STATUSES = [
  'Active',
  'Expired',
  'Archived',
  'Deleted',
  'Replaced',
  'Pending Review',
  'Verified',
];

export const PATIENT_VISIBLE_TYPES = new Set([
  'Lab Report',
  'Imaging Report',
  'Pathology Report',
  'Discharge Summary',
  'Prescription',
  'Clinical Note',
]);

export const SUMMARY_CARDS = [
  { key: 'total', label: 'Total Documents' },
  { key: 'registration', label: 'Registration Documents' },
  { key: 'dashboard', label: 'Dashboard Documents' },
  { key: 'insurance', label: 'Insurance Documents' },
  { key: 'consent', label: 'Consent Forms' },
  { key: 'clinical', label: 'Clinical Documents' },
];

export function emptyUploadForm(encounterId = '') {
  return {
    title: '',
    documentType: '',
    category: '',
    source: 'Patient Dashboard',
    encounterId: encounterId || '',
    description: '',
    documentDate: '',
    expirationDate: '',
    isConfidential: false,
    patientVisible: false,
    tags: '',
  };
}

export function emptyEditForm(doc) {
  return {
    title: doc?.title || doc?.documentName || '',
    documentType: doc?.documentType || '',
    category: doc?.category || '',
    encounterId: doc?.encounterId || '',
    description: doc?.description || '',
    documentDate: doc?.documentDate ? doc.documentDate.slice(0, 10) : '',
    expirationDate: doc?.expirationDate ? doc.expirationDate.slice(0, 10) : '',
    isConfidential: !!doc?.isConfidential,
    patientVisible: !!doc?.patientVisible,
    tags: Array.isArray(doc?.tags) ? doc.tags.join(', ') : '',
  };
}

export function parseTagsInput(value) {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function statusBadgeVariant(status) {
  switch (status) {
    case 'Verified':
      return 'default';
    case 'Expired':
      return 'destructive';
    case 'Archived':
      return 'secondary';
    case 'Pending Review':
      return 'outline';
    default:
      return 'secondary';
  }
}
