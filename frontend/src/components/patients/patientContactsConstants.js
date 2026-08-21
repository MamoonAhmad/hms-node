export const PATIENT_RELATIONSHIP_OPTIONS = [
  { value: 'self', label: 'Self' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'partner', label: 'Partner / significant other' },
  { value: 'domestic-partner', label: 'Domestic partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'step-parent', label: 'Step-parent' },
  { value: 'child', label: 'Child' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'step-child', label: 'Step-child' },
  { value: 'foster-child', label: 'Foster child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'niece', label: 'Niece' },
  { value: 'nephew', label: 'Nephew' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'in-law', label: 'In-law' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'legal-guardian', label: 'Legal guardian' },
  { value: 'foster-parent', label: 'Foster parent' },
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'healthcare-proxy', label: 'Healthcare proxy' },
  { value: 'power-of-attorney', label: 'Power of attorney' },
  { value: 'case-manager', label: 'Case manager' },
  { value: 'employer', label: 'Employer' },
  { value: 'friend', label: 'Friend' },
  { value: 'neighbor', label: 'Neighbor' },
  { value: 'roommate', label: 'Roommate' },
  { value: 'other', label: 'Other' },
];

export const NEXT_OF_KIN_RELATIONSHIP_OPTIONS = PATIENT_RELATIONSHIP_OPTIONS.filter(
  (opt) => opt.value !== 'self',
);

export const GUARANTOR_RELATIONSHIP_OPTIONS = PATIENT_RELATIONSHIP_OPTIONS;

export const PATIENT_RELATIONSHIP_VALUES = PATIENT_RELATIONSHIP_OPTIONS.map((opt) => opt.value);

const RELATIONSHIP_LABELS = Object.fromEntries(
  PATIENT_RELATIONSHIP_OPTIONS.map((o) => [o.value, o.label]),
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

export const PHONE_REGEX = /^[+\d\s\-().]+$/;
