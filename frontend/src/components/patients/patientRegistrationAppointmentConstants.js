/** Stored on `referredBy`; labels shown in UI and review. */
export const REFERRAL_SOURCES = [
  { value: 'physician-referral', label: 'Physician referral' },
  { value: 'self-referral', label: 'Self-referral' },
  { value: 'hospital-transfer', label: 'Hospital / facility transfer' },
  { value: 'emergency-department', label: 'Emergency department' },
  { value: 'insurance-payer', label: 'Insurance / payer' },
  { value: 'employer', label: 'Employer' },
  { value: 'family-friend', label: 'Family or friend' },
  { value: 'marketing-community', label: 'Marketing / community outreach' },
  { value: 'other-provider', label: 'Other health care provider' },
  { value: 'not-applicable', label: 'Not applicable / unknown' },
];

export const DEPARTMENT_OPTIONS = [
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'General Medicine', label: 'General Medicine' },
  { value: 'Emergency Medicine', label: 'Emergency Medicine' },
  { value: 'Orthopedics', label: 'Orthopedics' },
  { value: 'Pediatrics', label: 'Pediatrics' },
  { value: 'Radiology', label: 'Radiology' },
  { value: 'Surgery', label: 'Surgery' },
  { value: 'Urology', label: 'Urology' },
];

export const OUTPATIENT_PROVIDERS = [
  { id: 'prov-1', name: 'Dr. John Smith' },
  { id: 'prov-2', name: 'Dr. Sarah Johnson' },
  { id: 'prov-3', name: 'Dr. Emily Brown' },
  { id: 'prov-4', name: 'Dr. Michael Lee' },
  { id: 'prov-5', name: 'Dr. Aisha Khan' },
];

export const REFERRAL_PAYLOAD_KEYS = [
  'referredBy',
  'referringPhysicianFirstName',
  'referringPhysicianLastName',
  'referringPhysicianNpi',
  'referringPhysicianPhone',
  'referringPhysicianFax',
  'referringPhysicianAddress',
  'referringPhysicianCity',
  'referringPhysicianState',
  'referringPhysicianZip',
];

export function emptyReferralPayload() {
  return REFERRAL_PAYLOAD_KEYS.reduce((acc, k) => {
    acc[k] = '';
    return acc;
  }, {});
}

export function formatReferredByForReview(value) {
  if (value == null || value === '') return '';
  const match = REFERRAL_SOURCES.find((o) => o.value === value);
  return match ? match.label : String(value);
}

export function formatDepartmentForReview(value) {
  if (value == null || value === '') return '';
  const match = DEPARTMENT_OPTIONS.find((o) => o.value === value);
  return match ? match.label : String(value);
}

/** Map patient-registration visit type values to API appointmentType enum. */
export const VISIT_TYPE_TO_API_TYPE = {
  'new-patient': 'New',
  'follow-up': 'Follow-up',
  urgent: 'New',
  telehealth: 'Televisit',
  procedure: 'New',
};

export const API_TYPE_TO_VISIT_TYPE = {
  New: 'new-patient',
  'Follow-up': 'follow-up',
  Televisit: 'telehealth',
};

const REFERRAL_TAG = '\n\n__HMS_REFERRAL__:';

export function buildNotesWithReferral(appointmentNotes, referral) {
  const ref = referral || {};
  const hasRef = REFERRAL_PAYLOAD_KEYS.some((k) => {
    const v = ref[k];
    return v != null && String(v).trim() !== '';
  });
  const base = (appointmentNotes || '').trimEnd();
  if (!hasRef) return base || null;
  const payload = {};
  REFERRAL_PAYLOAD_KEYS.forEach((k) => {
    const v = ref[k];
    if (v != null && String(v).trim() !== '') payload[k] = String(v).trim();
  });
  return `${base}${REFERRAL_TAG}${JSON.stringify(payload)}`;
}

export function parseNotesWithReferral(notes) {
  if (!notes || typeof notes !== 'string') {
    return { appointmentNotes: '', referral: emptyReferralPayload() };
  }
  const idx = notes.indexOf(REFERRAL_TAG);
  if (idx === -1) {
    return { appointmentNotes: notes, referral: emptyReferralPayload() };
  }
  const appointmentNotes = notes.slice(0, idx).trimEnd();
  let payload = {};
  try {
    payload = JSON.parse(notes.slice(idx + REFERRAL_TAG.length)) || {};
  } catch {
    payload = {};
  }
  const referral = emptyReferralPayload();
  REFERRAL_PAYLOAD_KEYS.forEach((k) => {
    if (payload[k] != null) referral[k] = String(payload[k]);
  });
  return { appointmentNotes, referral };
}
