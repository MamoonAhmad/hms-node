import { getWorldCountryOptions, getWorldLanguageOptions } from '@/lib/worldCatalog';

export const DEFAULT_COUNTRY = 'US';

export const COUNTRY_OPTIONS = getWorldCountryOptions();

export const SUFFIX_OPTIONS = [
  { value: 'Jr', label: 'Jr' },
  { value: 'Sr', label: 'Sr' },
  { value: 'I', label: 'I' },
  { value: 'II', label: 'II' },
  { value: 'III', label: 'III' },
  { value: 'IV', label: 'IV' },
  { value: 'V', label: 'V' },
  { value: 'VI', label: 'VI' },
  { value: 'VII', label: 'VII' },
  { value: 'VIII', label: 'VIII' },
  { value: 'IX', label: 'IX' },
  { value: 'X', label: 'X' },
  { value: 'Esq', label: 'Esq' },
  { value: 'MD', label: 'MD' },
  { value: 'DO', label: 'DO' },
  { value: 'PhD', label: 'PhD' },
  { value: 'DDS', label: 'DDS' },
  { value: 'DMD', label: 'DMD' },
  { value: 'DPM', label: 'DPM' },
  { value: 'OD', label: 'OD' },
  { value: 'PharmD', label: 'PharmD' },
  { value: 'DNP', label: 'DNP' },
  { value: 'NP', label: 'NP' },
  { value: 'PA', label: 'PA' },
  { value: 'RN', label: 'RN' },
  { value: 'LPN', label: 'LPN' },
  { value: 'JD', label: 'JD' },
  { value: 'MBA', label: 'MBA' },
  { value: 'Ret', label: 'Ret' },
];

export const NO_EMAIL_REASON_OPTIONS = [
  { value: 'declined', label: 'Patient declined to provide email' },
  { value: 'no-access', label: 'No email access / does not use email' },
  { value: 'privacy', label: 'Privacy / security concern' },
  { value: 'homeless', label: 'Unhoused / no stable contact' },
  { value: 'cognitive', label: 'Cognitive or communication limitation' },
  { value: 'minor', label: 'Minor — use parent/guardian contact' },
  { value: 'language-barrier', label: 'Language barrier' },
  { value: 'other', label: 'Other' },
];

export const VETERAN_STATUS_DETAIL_OPTIONS = [
  { value: 'honorably-discharged', label: 'Honorably discharged' },
  { value: 'general-discharge', label: 'General discharge' },
  { value: 'other-than-honorable', label: 'Other than honorable' },
  { value: 'dishonorably-discharged', label: 'Dishonorably discharged' },
  { value: 'currently-serving', label: 'Currently serving (active duty)' },
  { value: 'national-guard-reserve', label: 'National Guard / Reserve' },
  { value: 'retired', label: 'Retired' },
  { value: 'disabled-veteran', label: 'Service-connected disabled veteran' },
  { value: 'unknown', label: 'Unknown' },
];

export const DISABILITY_TYPE_OPTIONS = [
  { value: 'hearing', label: 'Hearing' },
  { value: 'vision', label: 'Vision' },
  { value: 'mobility', label: 'Mobility / orthopedic' },
  { value: 'cognitive', label: 'Cognitive / intellectual' },
  { value: 'speech', label: 'Speech / language' },
  { value: 'mental-health', label: 'Mental health' },
  { value: 'developmental', label: 'Developmental' },
  { value: 'chronic-illness', label: 'Chronic illness' },
  { value: 'neurological', label: 'Neurological' },
  { value: 'other', label: 'Other' },
];

export const PREFERRED_CONTACT_METHOD_OPTIONS = [
  { value: 'cell', label: 'Cell' },
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'email', label: 'Email' },
];

export const PREFIX_OPTIONS = [
  { value: 'mr', label: 'Mr' },
  { value: 'mrs', label: 'Mrs' },
  { value: 'ms', label: 'Ms' },
  { value: 'miss', label: 'Miss' },
  { value: 'dr', label: 'Dr' },
  { value: 'mx', label: 'Mx' },
];

export const LANGUAGE_OPTIONS = getWorldLanguageOptions();

export const RACE_OPTIONS = [
  { value: 'american-indian', label: 'American Indian or Alaska Native' },
  { value: 'asian', label: 'Asian' },
  { value: 'black', label: 'Black or African American' },
  { value: 'native-hawaiian', label: 'Native Hawaiian or Other Pacific Islander' },
  { value: 'white', label: 'White' },
  { value: 'more-than-one', label: 'More than one race' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'declined', label: 'Declined to specify' },
  { value: 'other', label: 'Other' },
];

export const ADVANCE_DIRECTIVE_TYPE_OPTIONS = [
  { value: 'living-will', label: 'Living will' },
  { value: 'dnr', label: 'Do not resuscitate (DNR)' },
  { value: 'healthcare-proxy', label: 'Healthcare proxy' },
  { value: 'polst', label: 'POLST / MOLST' },
  { value: 'other', label: 'Other' },
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
  veteranStatusDetail: Object.fromEntries(VETERAN_STATUS_DETAIL_OPTIONS.map((o) => [o.value, o.label])),
  disabilityStatus: Object.fromEntries(DISABILITY_STATUS_OPTIONS.map((o) => [o.value, o.label])),
  disabilityType: Object.fromEntries(DISABILITY_TYPE_OPTIONS.map((o) => [o.value, o.label])),
  noEmailReason: Object.fromEntries(NO_EMAIL_REASON_OPTIONS.map((o) => [o.value, o.label])),
  suffix: Object.fromEntries(SUFFIX_OPTIONS.map((o) => [o.value, o.label])),
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
  if (method === 'home') return formData.homePhone?.trim() || '';
  if (method === 'work') return formData.workPhone?.trim() || '';
  if (method === 'email') return formData.email?.trim() || '';
  return formData.cellPhone?.trim() || '';
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
