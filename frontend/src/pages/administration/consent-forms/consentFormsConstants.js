export const CONSENT_FORMS_STORAGE_KEY = 'hms_consent_form_templates';

export const CONSENT_TYPE_OPTIONS = [
  { value: 'general-treatment', label: 'General Treatment Consent' },
  { value: 'telemedicine', label: 'Telemedicine Consent' },
  { value: 'privacy-hipaa', label: 'Privacy/HIPAA Consent' },
  { value: 'financial', label: 'Financial Consent' },
  { value: 'surgical', label: 'Surgical Consent' },
  { value: 'procedure', label: 'Procedure Consent' },
  { value: 'release-of-information', label: 'Release of Information' },
];

export const CONSENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft', label: 'Draft' },
];

export const CONSENT_LANGUAGE_OPTIONS = [
  'English',
  'Urdu',
  'Arabic',
  'Spanish',
  'French',
  'Other',
];

export function emptyConsentForm() {
  return {
    consentTitle: '',
    consentType: '',
    description: '',
    consentContent: '',
    isSignatureRequired: true,
    requiresWitnessSignature: false,
    requiresProviderSignature: false,
    effectiveDate: '',
    expiryDate: '',
    status: 'draft',
    department: '',
    language: 'English',
    versionNumber: '',
    tags: '',
    attachmentName: '',
    attachmentDataUrl: '',
  };
}

export function getStoredConsentForms() {
  try {
    const raw = localStorage.getItem(CONSENT_FORMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setStoredConsentForms(list) {
  localStorage.setItem(CONSENT_FORMS_STORAGE_KEY, JSON.stringify(list));
}

export function formatConsentType(value) {
  const match = CONSENT_TYPE_OPTIONS.find((o) => o.value === value);
  return match ? match.label : value || '—';
}

export function formatConsentStatus(value) {
  const match = CONSENT_STATUS_OPTIONS.find((o) => o.value === value);
  return match ? match.label : value || '—';
}

export function formatAuditDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export function validateConsentForm(form) {
  const errors = {};
  if (!form.consentTitle?.trim()) errors.consentTitle = 'Consent title is required';
  if (!form.consentType) errors.consentType = 'Consent type is required';
  if (!stripHtml(form.consentContent)) errors.consentContent = 'Consent content is required';
  if (form.isSignatureRequired === undefined || form.isSignatureRequired === null) {
    errors.isSignatureRequired = 'Please indicate if a signature is required';
  }
  if (!form.status) errors.status = 'Status is required';
  return errors;
}
