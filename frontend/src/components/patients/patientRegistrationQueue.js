export const PATIENT_QUEUE_STORAGE_KEY = 'hms_patient_registration_queue';

export const REGISTRATION_CHANNEL_OPTIONS = [
  { value: 'appointment', label: 'Scheduled' },
  { value: 'walk_in', label: 'Walk-In' },
  { value: 'registration_only', label: 'Registration Only' },
];

export function formatRegistrationChannel(value) {
  const match = REGISTRATION_CHANNEL_OPTIONS.find((o) => o.value === value);
  return match ? match.label : value || '—';
}

export function getPatientQueueDrafts() {
  try {
    const raw = localStorage.getItem(PATIENT_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setPatientQueueDrafts(list) {
  localStorage.setItem(PATIENT_QUEUE_STORAGE_KEY, JSON.stringify(list));
}

export function savePatientQueueDraft({
  id,
  registrationChannel,
  formData,
  documents,
  insuranceList,
}) {
  const existing = id ? getPatientQueueDrafts().find((e) => e.id === id) : null;
  const entry = {
    id: existing?.id ?? `queue-${crypto.randomUUID()}`,
    queuedAt: existing?.queuedAt ?? new Date().toISOString(),
    registrationChannel: registrationChannel || 'appointment',
    registrationStatus: 'pending',
    formData,
    documents: documents ?? [],
    insuranceList: insuranceList ?? [],
  };
  const list = getPatientQueueDrafts().filter((e) => e.id !== entry.id);
  setPatientQueueDrafts([entry, ...list]);
  return entry;
}

export function getPatientQueueDraftById(id) {
  return getPatientQueueDrafts().find((e) => e.id === id) ?? null;
}

export function removePatientQueueDraft(id) {
  setPatientQueueDrafts(getPatientQueueDrafts().filter((e) => e.id !== id));
}

/** Map a queue draft to a row shape compatible with the patients listing table. */
export function queueDraftToPatientRow(entry) {
  const f = entry?.formData ?? {};
  const name = [f.firstName, f.lastName].filter(Boolean).join(' ').trim();
  return {
    id: entry.id,
    mrn: '—',
    firstName: f.firstName || '—',
    lastName: f.lastName || (name ? '' : 'Queued'),
    middleName: f.middleName || '',
    dateOfBirth: f.dateOfBirth || null,
    gender: f.gender || '',
    cellPhone: f.cellPhone || '',
    homePhone: f.homePhone || '',
    workPhone: f.workPhone || '',
    contactNumber: f.cellPhone || f.homePhone || f.workPhone || '',
    email: f.email || '',
    billingType: f.billingType || f.insuranceBillingType || '',
    insuranceBillingType: f.insuranceBillingType || f.billingType || '',
    insuranceList: entry.insuranceList || [],
    consentFormSigned: false,
    registrationStatus: 'draft',
    registrationChannel: entry.registrationChannel,
    createdAt: entry.queuedAt,
    _isQueueDraft: true,
  };
}

export function hasDraftableRegistrationData(formData) {
  if (!formData) return false;
  return !!(
    formData.firstName?.trim() ||
    formData.lastName?.trim() ||
    formData.dateOfBirth ||
    formData.email?.trim() ||
    formData.cellPhone?.trim() ||
    formData.homePhone?.trim()
  );
}

export function mergeQueueDraftsWithPatients(apiPatients, { includeDrafts = true } = {}) {
  if (!includeDrafts) return apiPatients;
  const drafts = getPatientQueueDrafts().map(queueDraftToPatientRow);
  const apiIds = new Set((apiPatients || []).map((p) => p.id));
  const uniqueDrafts = drafts.filter((d) => !apiIds.has(d.id));
  return [...uniqueDrafts, ...(apiPatients || [])];
}
