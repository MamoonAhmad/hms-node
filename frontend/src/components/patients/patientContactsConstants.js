export const NEXT_OF_KIN_RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
];

export const GUARANTOR_RELATIONSHIP_OPTIONS = [
  { value: 'self', label: 'Self' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'other', label: 'Other' },
];

const RELATIONSHIP_LABELS = Object.fromEntries(
  [...NEXT_OF_KIN_RELATIONSHIP_OPTIONS, ...GUARANTOR_RELATIONSHIP_OPTIONS].map((o) => [
    o.value,
    o.label,
  ]),
);

export function formatContactRelationship(value) {
  if (!value) return value;
  return RELATIONSHIP_LABELS[value] ?? value;
}

export function isPatientMinor(dateOfBirth) {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age < 18;
}

export function shouldShowLegalGuardianSection(dateOfBirth, patientIsMinor) {
  return isPatientMinor(dateOfBirth) || Boolean(patientIsMinor);
}

export const PHONE_REGEX = /^[\d\s\-()]+$/;
