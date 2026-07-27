import { getCountryOptions } from '@/lib/phoneNumberUtils';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_VALIDATION_MESSAGE = 'Please enter a valid email address.';

export const REGISTRATION_CHANNEL_REGISTRATION_ONLY = 'registration_only';

export const US_STATE_OPTIONS = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export const ADDRESS_COUNTRY_OPTIONS = getCountryOptions().map((c) => ({
  value: c.code,
  label: c.name,
}));

export const MILITARY_BRANCH_OPTIONS = [
  { value: 'army', label: 'Army' },
  { value: 'navy', label: 'Navy' },
  { value: 'air-force', label: 'Air Force' },
  { value: 'marines', label: 'Marines' },
  { value: 'coast-guard', label: 'Coast Guard' },
  { value: 'space-force', label: 'Space Force' },
  { value: 'national-guard', label: 'National Guard' },
  { value: 'reserve', label: 'Reserve' },
  { value: 'other', label: 'Other' },
];

export const DISABILITY_OPTIONS = [
  { value: 'hearing', label: 'Hearing Disability' },
  { value: 'vision', label: 'Vision Disability' },
  { value: 'physical', label: 'Physical Disability' },
  { value: 'intellectual', label: 'Intellectual Disability' },
  { value: 'developmental', label: 'Developmental Disability' },
  { value: 'cognitive', label: 'Cognitive Disability' },
  { value: 'speech', label: 'Speech Disability' },
  { value: 'other', label: 'Other' },
];

export const INTERPRETER_LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'urdu', label: 'Urdu' },
  { value: 'french', label: 'French' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'punjabi', label: 'Punjabi' },
  { value: 'russian', label: 'Russian' },
  { value: 'german', label: 'German' },
  { value: 'other', label: 'Other' },
];

export const VISIT_MODALITY_OPTIONS = [
  { value: 'in-house', label: 'In Person' },
  { value: 'phone', label: 'Phone' },
  { value: 'telehealth', label: 'Telehealth' },
];

export const DEFAULT_VISIT_MODALITY = 'in-house';

export const GUARANTOR_SIGNATURE_MIN_AGE = 6;

export const ACCESSIBILITY_REQUIREMENT_GROUPS = [
  {
    id: 'mobility',
    label: 'Mobility Assistance',
    options: [
      { value: 'wheelchair-required', label: 'Wheelchair Required' },
      { value: 'walker-required', label: 'Walker Required' },
      { value: 'cane-assistance', label: 'Cane Assistance' },
      { value: 'mobility-assistance-required', label: 'Mobility Assistance Required' },
      { value: 'transfer-assistance-required', label: 'Transfer Assistance Required' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication Assistance',
    options: [
      { value: 'hearing-assistance-required', label: 'Hearing Assistance Required' },
      { value: 'sign-language-interpreter-required', label: 'Sign Language Interpreter Required' },
      { value: 'communication-board-required', label: 'Communication Board Required' },
      { value: 'speech-assistance-required', label: 'Speech Assistance Required' },
    ],
  },
  {
    id: 'language',
    label: 'Language Assistance',
    options: [
      { value: 'interpreter-required', label: 'Interpreter Required' },
      { value: 'spanish-interpreter', label: 'Spanish Interpreter' },
      { value: 'arabic-interpreter', label: 'Arabic Interpreter' },
      { value: 'urdu-interpreter', label: 'Urdu Interpreter' },
      { value: 'other-language-interpreter', label: 'Other Language Interpreter' },
    ],
  },
  {
    id: 'vision',
    label: 'Vision Assistance',
    options: [
      { value: 'vision-assistance-required', label: 'Vision Assistance Required' },
      { value: 'large-print-materials-required', label: 'Large Print Materials Required' },
      { value: 'reader-assistance-required', label: 'Reader Assistance Required' },
    ],
  },
  {
    id: 'transportation',
    label: 'Transportation',
    options: [
      { value: 'transportation-assistance-required', label: 'Transportation Assistance Required' },
    ],
  },
  {
    id: 'clinical',
    label: 'Clinical Accommodations',
    options: [
      { value: 'bariatric-equipment-required', label: 'Bariatric Equipment Required' },
      { value: 'oxygen-support-required', label: 'Oxygen Support Required' },
      { value: 'service-animal-accompanying-patient', label: 'Service Animal Accompanying Patient' },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    options: [
      { value: 'other-accommodation-required', label: 'Other Accommodation Required' },
    ],
  },
];

export function isValidEmail(value) {
  if (!value || !String(value).trim()) return true;
  return EMAIL_REGEX.test(String(value).trim());
}

export function calculateAgeFromDob(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function formatPatientFullName(formData) {
  return [formData?.firstName, formData?.middleName, formData?.lastName, formData?.suffix]
    .filter(Boolean)
    .join(' ')
    .trim();
}

export function isRegistrationOnlyChannel(channel) {
  return channel === REGISTRATION_CHANNEL_REGISTRATION_ONLY;
}

export function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function serializeJsonArray(value) {
  if (!Array.isArray(value) || !value.length) return null;
  return JSON.stringify(value);
}
