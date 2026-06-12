export const PATIENT_QUEUE_STORAGE_KEY = 'hms_patient_registration_queue';

export const REGISTRATION_CHANNEL_OPTIONS = [
  { value: 'appointment', label: 'Appointment' },
  { value: 'walk_in', label: 'Walk in' },
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
    dateOfBirth: f.dateOfBirth || null,
    gender: f.gender || '—',
    contactNumber: f.cellPhone || f.homePhone || f.workPhone || f.email || '—',
    email: f.email || '',
    registrationStatus: 'pending',
    registrationChannel: entry.registrationChannel,
    createdAt: entry.queuedAt,
    _isQueueDraft: true,
  };
}
