export const DEFAULT_COUNTRY = 'US';

export const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'MX', label: 'Mexico' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'OTHER', label: 'Other' },
];

export const PREFERRED_CONTACT_METHOD_OPTIONS = [
  { value: 'cell', label: 'Cell' },
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'email', label: 'Email' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const GENDER_IDENTITY_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'transgender-male', label: 'Transgender male' },
  { value: 'transgender-female', label: 'Transgender female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export const PRONOUN_OPTIONS = [
  { value: 'he-him', label: 'He/Him' },
  { value: 'she-her', label: 'She/Her' },
  { value: 'they-them', label: 'They/Them' },
  { value: 'other', label: 'Other' },
];

export const GOVERNMENT_ID_TYPE_OPTIONS = [
  { value: 'drivers-license', label: 'Driver license' },
  { value: 'state-id', label: 'State ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'other', label: 'Other' },
];

/** Minimum length for government ID number when provided, by ID type */
export const GOVERNMENT_ID_MIN_LENGTH = {
  'drivers-license': 5,
  'state-id': 5,
  passport: 6,
  other: 3,
};

export const YES_NO_UNKNOWN_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Unknown' },
];

export const DISABILITY_STATUS_OPTIONS = [
  ...YES_NO_UNKNOWN_OPTIONS,
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const LABEL_MAPS = {
  preferredContactMethod: Object.fromEntries(
    PREFERRED_CONTACT_METHOD_OPTIONS.map((o) => [o.value, o.label]),
  ),
  genderIdentity: Object.fromEntries(GENDER_IDENTITY_OPTIONS.map((o) => [o.value, o.label])),
  pronouns: Object.fromEntries(PRONOUN_OPTIONS.map((o) => [o.value, o.label])),
  governmentIdType: Object.fromEntries(GOVERNMENT_ID_TYPE_OPTIONS.map((o) => [o.value, o.label])),
  veteranStatus: Object.fromEntries(YES_NO_UNKNOWN_OPTIONS.map((o) => [o.value, o.label])),
  disabilityStatus: Object.fromEntries(DISABILITY_STATUS_OPTIONS.map((o) => [o.value, o.label])),
  country: Object.fromEntries(COUNTRY_OPTIONS.map((o) => [o.value, o.label])),
};

export function formatDemographicsLabel(field, value) {
  if (value === null || value === undefined || value === '') return value;
  const map = LABEL_MAPS[field];
  return map?.[value] ?? value;
}

export function maskGovernmentIdNumber(value) {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed.length <= 4) return '•'.repeat(trimmed.length);
  return `${'•'.repeat(Math.min(trimmed.length - 4, 12))}${trimmed.slice(-4)}`;
}

export function resolveContactNumber(formData) {
  const method = formData.preferredContactMethod;
  const cell = formData.cellPhone?.trim() || '';
  if (method === 'home') return formData.homePhone?.trim() || cell;
  if (method === 'work') return formData.workPhone?.trim() || cell;
  if (method === 'email') return formData.email?.trim() || cell;
  return cell;
}

export function formatProviderDisplayName(provider) {
  if (!provider) return '';
  const parts = [provider.firstName, provider.middleName, provider.lastName].filter(Boolean);
  const name = parts.join(' ');
  let specLabel = '';
  if (typeof provider.specialty === 'string') {
    specLabel = provider.specialty;
  } else if (provider.specialty?.name) {
    specLabel = provider.specialty.name;
  }
  return specLabel ? `${name} — ${specLabel}` : name;
}
