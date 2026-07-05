export const NOTE_TYPE_OPTIONS = [
  { id: 'soap', label: 'SOAP Notes' },
  { id: 'progress', label: 'Progress Notes' },
  { id: 'telephonic', label: 'Telephonic Notes' },
  { id: 'blank', label: 'Blank Notes' },
  { id: 'nurse', label: 'Nurse Notes' },
];

export const NOTE_TYPE_LABELS = Object.fromEntries(
  NOTE_TYPE_OPTIONS.map((o) => [o.id, o.label.replace(/s$/, '')]),
);

export const ADDENDUM_SECTIONS = {
  soap: [
    { id: 'subjective', label: 'Subjective' },
    { id: 'objective', label: 'Objective' },
    { id: 'assessment', label: 'Assessment' },
    { id: 'plan', label: 'Plan' },
  ],
  progress: [
    { id: 'clinicalSummary', label: 'Clinical Summary' },
    { id: 'assessment', label: 'Assessment' },
    { id: 'plan', label: 'Plan' },
  ],
  telephonic: [
    { id: 'callReason', label: 'Call Reason' },
    { id: 'discussion', label: 'Discussion' },
    { id: 'followUp', label: 'Follow-up' },
  ],
  nurse: [
    { id: 'nursingAssessment', label: 'Nursing Assessment' },
    { id: 'interventions', label: 'Interventions' },
    { id: 'education', label: 'Patient Education' },
  ],
  blank: [{ id: 'content', label: 'Note Content' }],
};

export function formatNoteDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export function formatShortDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}
