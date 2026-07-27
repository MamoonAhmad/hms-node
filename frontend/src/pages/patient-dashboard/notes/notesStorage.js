const STORAGE_KEY = 'hms_patient_clinical_notes_v1';

export const NOTE_TYPES = [
  { id: 'soap', label: 'SOAP Notes' },
  { id: 'telephonic', label: 'Telephonic Notes' },
  { id: 'progress', label: 'Progress Notes' },
  { id: 'procedure', label: 'Procedure Notes' },
  { id: 'communication', label: 'Communication Notes' },
  { id: 'blank', label: 'Blank Notes' },
];

function storageKey(patientId, appointmentId) {
  return `${patientId || 'unknown'}::${appointmentId || 'no-appt'}`;
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadNotes(patientId, appointmentId, noteType) {
  const all = readAll();
  const bucket = all[storageKey(patientId, appointmentId)] || {};
  return Array.isArray(bucket[noteType]) ? bucket[noteType] : [];
}

export function saveNotes(patientId, appointmentId, noteType, notes) {
  const all = readAll();
  const key = storageKey(patientId, appointmentId);
  const bucket = all[key] || {};
  bucket[noteType] = notes;
  all[key] = bucket;
  writeAll(all);
}

export function upsertNote(patientId, appointmentId, noteType, note) {
  const existing = loadNotes(patientId, appointmentId, noteType);
  const idx = existing.findIndex((n) => n.id === note.id);
  const next =
    idx >= 0
      ? existing.map((n, i) => (i === idx ? note : n))
      : [note, ...existing];
  saveNotes(patientId, appointmentId, noteType, next);
  return next;
}
