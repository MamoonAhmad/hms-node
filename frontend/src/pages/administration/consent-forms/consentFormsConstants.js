export const CONSENT_FORMS_STORAGE_KEY = 'hms_consent_form_templates';

export const CONSENT_TYPE_OPTIONS = [
  { value: 'general-treatment', label: 'General Treatment Consent' },
  { value: 'hipaa-privacy', label: 'HIPAA Privacy Consent' },
  { value: 'financial-responsibility', label: 'Financial Responsibility Consent' },
  { value: 'assignment-of-benefits', label: 'Assignment of Benefits' },
  { value: 'release-of-information', label: 'Release of Information Consent' },
  { value: 'bill-insurance', label: 'Consent to Bill Insurance' },
  { value: 'telehealth', label: 'Telehealth Consent' },
  { value: 'electronic-communication', label: 'Electronic Communication Consent' },
  { value: 'patient-portal', label: 'Patient Portal Consent' },
  { value: 'sms-reminder', label: 'SMS Reminder Consent' },
  { value: 'prescription-history', label: 'Prescription History Consent' },
  { value: 'minor-guardian', label: 'Minor/Guardian Consent' },
  { value: 'photography', label: 'Photography Consent' },
  { value: 'consent-withdrawal-revocation', label: 'Consent Withdrawal/Revocation' },
];

export const CONSENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft', label: 'Draft' },
];

export const CONSENT_LIST_TABS = {
  ALL: 'all',
  ACTIVE: 'active',
  DRAFT: 'draft',
  INACTIVE: 'inactive',
  SIGNATURE: 'signature',
};

export const CONSENT_LIST_TAB_OPTIONS = [
  { value: CONSENT_LIST_TABS.ALL, label: 'All Forms' },
  { value: CONSENT_LIST_TABS.ACTIVE, label: 'Active' },
  { value: CONSENT_LIST_TABS.DRAFT, label: 'Draft' },
  { value: CONSENT_LIST_TABS.INACTIVE, label: 'Inactive' },
  { value: CONSENT_LIST_TABS.SIGNATURE, label: 'Signature Required' },
];

/** Filter consent form templates by list tab (client-side until API exists). */
export function filterConsentFormsByTab(items, tab) {
  switch (tab) {
    case CONSENT_LIST_TABS.ACTIVE:
      return items.filter((row) => row.status === 'active');
    case CONSENT_LIST_TABS.DRAFT:
      return items.filter((row) => row.status === 'draft');
    case CONSENT_LIST_TABS.INACTIVE:
      return items.filter((row) => row.status === 'inactive');
    case CONSENT_LIST_TABS.SIGNATURE:
      return items.filter(
        (row) =>
          row.isSignatureRequired === true ||
          row.requiresWitnessSignature === true ||
          row.requiresProviderSignature === true,
      );
    default:
      return items;
  }
}

export const CONSENT_LANGUAGE_OPTIONS = [
  'English',
  'Urdu',
  'Arabic',
  'Spanish',
  'French',
  'Other',
];

export const SIGNATURE_PLACEMENT_OPTIONS = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'middle-left', label: 'Middle left' },
  { value: 'middle-center', label: 'Middle center' },
  { value: 'middle-right', label: 'Middle right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'inline-after-content', label: 'Inline — after consent text' },
  { value: 'separate-section', label: 'Separate section — below content' },
  { value: 'dedicated-page', label: 'Dedicated signature page' },
];

export function emptyConsentForm() {
  return {
    consentTitle: '',
    consentType: '',
    description: '',
    consentContent: '',
    isMandatory: false,
    isSignatureRequired: true,
    patientSignaturePlacement: '',
    requiresWitnessSignature: false,
    witnessSignaturePlacement: '',
    requiresProviderSignature: false,
    providerSignaturePlacement: '',
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

export const DUMMY_CONSENT_FORM_IDS = {
  GENERAL: 'demo-general-treatment-consent',
  HIPAA: 'demo-hipaa-privacy-consent',
};

const DEMO_CONSENT_HTML = `
<p>I voluntarily consent to examination, diagnosis, and treatment by the physicians, nurses, and allied health professionals of this facility. I understand that medical care may include laboratory tests, imaging studies, medications, procedures, and referrals as clinically indicated.</p>
<p><strong>I understand that:</strong></p>
<ul>
  <li>No guarantee has been made regarding the outcome of my care.</li>
  <li>I have the right to ask questions about my treatment and alternatives.</li>
  <li>I may withdraw this consent at any time, except where withdrawal is not permitted by law or would endanger others.</li>
  <li>My protected health information will be used and disclosed in accordance with applicable privacy laws.</li>
</ul>
<p>I confirm that I have received the facility's Notice of Privacy Practices (or been offered a copy) and that the information I have provided is accurate to the best of my knowledge.</p>
`.trim();

const DEMO_HIPAA_HTML = `
<p>This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.</p>
<p><strong>Uses and disclosures.</strong> We may use your health information to provide treatment, obtain payment, and conduct health care operations. We may also contact you about appointments, test results, and care coordination through your preferred communication method.</p>
<p><strong>Your rights.</strong> You have the right to request restrictions, receive confidential communications, inspect and obtain a copy of your record, request amendments, and receive an accounting of certain disclosures.</p>
`.trim();

/** Sample templates for preview / demo (merged into storage once). */
export function createDummyConsentForms() {
  const now = new Date().toISOString();
  const effective = new Date();
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);

  const demoCreatedHistory = (title) => ({
    id: `demo-created-${title}`,
    action: 'created',
    user: 'System Demo',
    at: now,
    changes: [],
  });

  return [
    {
      id: DUMMY_CONSENT_FORM_IDS.GENERAL,
      consentTitle: 'General Consent for Treatment & Services',
      consentType: 'general-treatment',
      description:
        'Standard outpatient consent for evaluation, treatment, and coordination of care. Includes patient, witness, and provider signature blocks.',
      consentContent: DEMO_CONSENT_HTML,
      isMandatory: true,
      isSignatureRequired: true,
      patientSignaturePlacement: 'bottom-left',
      requiresWitnessSignature: true,
      witnessSignaturePlacement: 'bottom-center',
      requiresProviderSignature: true,
      providerSignaturePlacement: 'bottom-right',
      effectiveDate: effective.toISOString().slice(0, 10),
      expiryDate: expiry.toISOString().slice(0, 10),
      status: 'active',
      department: 'OPD',
      language: 'English',
      versionNumber: '2.1',
      tags: 'treatment, outpatient, registration',
      attachmentName: '',
      attachmentDataUrl: '',
      createdBy: 'System Demo',
      createdDate: now,
      updatedBy: 'System Demo',
      updatedDate: now,
      history: [demoCreatedHistory('general')],
    },
    {
      id: DUMMY_CONSENT_FORM_IDS.HIPAA,
      consentTitle: 'Notice of Privacy Practices (HIPAA)',
      consentType: 'hipaa-privacy',
      description: 'Privacy acknowledgment with patient signature placed after the consent text.',
      consentContent: DEMO_HIPAA_HTML,
      isMandatory: true,
      isSignatureRequired: true,
      patientSignaturePlacement: 'inline-after-content',
      requiresWitnessSignature: false,
      witnessSignaturePlacement: '',
      requiresProviderSignature: false,
      providerSignaturePlacement: '',
      effectiveDate: effective.toISOString().slice(0, 10),
      expiryDate: '',
      status: 'active',
      department: 'All departments',
      language: 'English',
      versionNumber: '1.0',
      tags: 'hipaa, privacy, npp',
      attachmentName: '',
      attachmentDataUrl: '',
      createdBy: 'System Demo',
      createdDate: now,
      updatedBy: 'System Demo',
      updatedDate: now,
      history: [demoCreatedHistory('hipaa')],
    },
  ];
}

/** Ensure demo templates exist in local storage (idempotent). */
export function ensureConsentFormSeedData() {
  const existing = getStoredConsentFormsRaw();
  const demoIds = new Set(Object.values(DUMMY_CONSENT_FORM_IDS));
  const missing = createDummyConsentForms().filter((demo) => !existing.some((r) => r.id === demo.id));
  if (missing.length === 0) return existing;
  const merged = [...missing, ...existing];
  setStoredConsentForms(merged);
  return merged;
}

function getStoredConsentFormsRaw() {
  try {
    const raw = localStorage.getItem(CONSENT_FORMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getStoredConsentForms() {
  return getStoredConsentFormsRaw();
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

export function formatSignaturePlacement(value) {
  const match = SIGNATURE_PLACEMENT_OPTIONS.find((o) => o.value === value);
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
  if (form.isSignatureRequired && !form.patientSignaturePlacement) {
    errors.patientSignaturePlacement = 'Select where the patient signature should appear';
  }
  if (form.requiresWitnessSignature && !form.witnessSignaturePlacement) {
    errors.witnessSignaturePlacement = 'Select where the witness signature should appear';
  }
  if (form.requiresProviderSignature && !form.providerSignaturePlacement) {
    errors.providerSignaturePlacement = 'Select where the provider signature should appear';
  }
  if (!form.status) errors.status = 'Status is required';
  return errors;
}
