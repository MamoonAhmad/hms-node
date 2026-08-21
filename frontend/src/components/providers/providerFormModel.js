import { validatePhoneNumber } from '@/lib/phoneNumberUtils';
import { resolveUsStateCode, usStateLabel } from '@/lib/usStates';

export const FORM_NONE = '__none__';

export const STEPS = [
  { id: 'identity', label: 'Identity' },
  { id: 'specialty', label: 'Specialty' },
  { id: 'licenses', label: 'Licenses' },
  { id: 'contact', label: 'Contact' },
  { id: 'billing', label: 'Billing' },
  { id: 'review', label: 'Review' },
];

export const STEP_TITLES = [
  'Identity & demographics',
  'Specialty & taxonomy',
  'Licenses & registrations',
  'Contact & address',
  'Billing & tax',
  'Practice settings & review',
];

export const NPI_TYPE_OPTIONS = [
  { value: 'type_1', label: 'Type 1 – Individual' },
  { value: 'type_2', label: 'Type 2 – Organization' },
];

export const SUFFIX_OPTIONS = [
  { value: 'Jr', label: 'Jr' },
  { value: 'Sr', label: 'Sr' },
  { value: 'II', label: 'II' },
  { value: 'III', label: 'III' },
  { value: 'IV', label: 'IV' },
];

export const PROVIDER_TYPE_OPTIONS = [
  { value: 'physician', label: 'Physician' },
  { value: 'np', label: 'Nurse Practitioner' },
  { value: 'pa', label: 'Physician Assistant' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'midwife', label: 'Midwife' },
  { value: 'other', label: 'Other' },
];

export const DEGREE_OPTIONS = [
  { value: 'MD', label: 'MD' },
  { value: 'DO', label: 'DO' },
  { value: 'MBBS', label: 'MBBS' },
  { value: 'NP', label: 'NP' },
  { value: 'PA', label: 'PA' },
  { value: 'DPM', label: 'DPM' },
  { value: 'DDS', label: 'DDS' },
  { value: 'DMD', label: 'DMD' },
  { value: 'DC', label: 'DC' },
  { value: 'PhD', label: 'PhD' },
  { value: 'PsyD', label: 'PsyD' },
  { value: 'LCSW', label: 'LCSW' },
  { value: 'RN', label: 'RN' },
  { value: 'Other', label: 'Other' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'dont_want_to_answer', label: "Don't want to answer" },
];

export const TAX_ID_TYPE_OPTIONS = [
  { value: 'ein', label: 'EIN (Employer)' },
  { value: 'ssn', label: 'SSN (Sole proprietor)' },
];

export const TREATMENT_OPTIONS = [
  { value: 'inpatient', label: 'Inpatient' },
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'both', label: 'Both' },
  { value: 'none', label: 'None' },
];

export const initialFormData = {
  npi: '',
  npiType: 'type_1',
  initials: '',
  firstName: '',
  lastName: '',
  middleName: '',
  suffix: '',
  gender: '',
  dateOfBirth: '',
  providerType: '',
  specialtyId: '',
  subSpecialtyId: '',
  departmentId: '',
  taxonomy: '',
  email: '',
  taxId: '',
  taxIdType: '',
  group: '',
  groupNpi: '',
  medicarePtan: '',
  medicaidId: '',
  caqhId: '',
  deaNumber: '',
  deaEffectiveDate: '',
  deaExpiryDate: '',
  stateLicenseNumber: '',
  licenseState: '',
  stateLicenseEffectiveDate: '',
  stateLicenseExpiryDate: '',
  csrLicenseNumber: '',
  csrExpiryDate: '',
  mobileNumber: '',
  officePhone: '',
  fax: '',
  degree: '',
  experience: '',
  address: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
  zipPlus4: '',
  treatment: '',
  cprsTabEffectiveDate: '',
  isActive: true,
};

const dateFields = [
  'dateOfBirth',
  'deaEffectiveDate',
  'deaExpiryDate',
  'stateLicenseEffectiveDate',
  'stateLicenseExpiryDate',
  'csrExpiryDate',
  'cprsTabEffectiveDate',
];

export function toDateInputValue(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export function fkTrim(v) {
  if (!v || v === FORM_NONE) return '';
  return String(v).trim();
}

function normalizeGender(value) {
  if (!value) return '';
  const lower = String(value).trim().toLowerCase();
  if (lower === 'male') return 'male';
  if (lower === 'female') return 'female';
  if (lower.includes('don')) return 'dont_want_to_answer';
  return String(value).trim();
}

function splitZip(zip, zipPlus4) {
  const plus = String(zipPlus4 || '').replace(/\D/g, '').slice(0, 4);
  const digits = String(zip || '').replace(/\D/g, '');
  if (digits.length >= 9) {
    return { zip: digits.slice(0, 5), zipPlus4: plus || digits.slice(5, 9) };
  }
  if (digits.length >= 5) {
    return { zip: digits.slice(0, 5), zipPlus4: plus };
  }
  return { zip: String(zip || '').trim(), zipPlus4: plus };
}

export function mapProviderToForm(provider) {
  if (!provider) return { ...initialFormData };

  const specialtyId = provider.specialtyId ?? provider.specialty?.id ?? '';
  const subSpecialtyId = provider.subSpecialtyId ?? provider.subSpecialty?.id ?? '';
  const departmentId = provider.departmentId ?? provider.department?.id ?? '';
  const { zip, zipPlus4 } = splitZip(provider.zip, provider.zipPlus4);

  return {
    ...initialFormData,
    npi: provider.npi ?? '',
    npiType: provider.npiType || 'type_1',
    initials: provider.initials ?? '',
    firstName: provider.firstName ?? '',
    lastName: provider.lastName ?? '',
    middleName: provider.middleName ?? '',
    suffix: provider.suffix ?? '',
    gender: normalizeGender(provider.gender),
    dateOfBirth: toDateInputValue(provider.dateOfBirth),
    providerType: provider.providerType ?? '',
    specialtyId,
    subSpecialtyId,
    departmentId,
    taxonomy: provider.taxonomy ?? '',
    email: provider.email ?? '',
    taxId: provider.taxId ?? '',
    taxIdType: provider.taxIdType ?? '',
    group: provider.group ?? '',
    groupNpi: provider.groupNpi ?? '',
    medicarePtan: provider.medicarePtan ?? '',
    medicaidId: provider.medicaidId ?? '',
    caqhId: provider.caqhId ?? '',
    deaNumber: provider.deaNumber ?? '',
    deaEffectiveDate: toDateInputValue(provider.deaEffectiveDate),
    deaExpiryDate: toDateInputValue(provider.deaExpiryDate),
    stateLicenseNumber: provider.stateLicenseNumber ?? '',
    licenseState: resolveUsStateCode(provider.licenseState),
    stateLicenseEffectiveDate: toDateInputValue(provider.stateLicenseEffectiveDate),
    stateLicenseExpiryDate: toDateInputValue(provider.stateLicenseExpiryDate),
    csrLicenseNumber: provider.csrLicenseNumber ?? '',
    csrExpiryDate: toDateInputValue(provider.csrExpiryDate),
    mobileNumber: provider.mobileNumber ?? '',
    officePhone: provider.officePhone ?? '',
    fax: provider.fax ?? '',
    degree: provider.degree ?? '',
    experience: provider.experience ?? '',
    address: provider.address ?? '',
    addressLine2: provider.addressLine2 ?? '',
    city: provider.city ?? '',
    state: resolveUsStateCode(provider.state),
    zip,
    zipPlus4,
    treatment: provider.treatment ?? '',
    cprsTabEffectiveDate: toDateInputValue(provider.cprsTabEffectiveDate),
    isActive: provider.isActive !== false,
  };
}

function trimOrNull(value) {
  const v = value?.trim?.() ?? value;
  if (v == null || v === '' || v === FORM_NONE) return null;
  return String(v).trim();
}

function normalizePhone(value) {
  const result = validatePhoneNumber(value);
  return result.normalized ?? trimOrNull(value);
}

export function buildProviderSubmitPayload(formData) {
  const { zip, zipPlus4 } = splitZip(formData.zip, formData.zipPlus4);

  const out = {
    npi: String(formData.npi || '').trim(),
    npiType: trimOrNull(formData.npiType),
    initials: trimOrNull(formData.initials),
    firstName: formData.firstName?.trim(),
    lastName: formData.lastName?.trim(),
    middleName: trimOrNull(formData.middleName),
    suffix: trimOrNull(formData.suffix),
    gender: formData.gender?.trim(),
    providerType: trimOrNull(formData.providerType),
    taxonomy: trimOrNull(formData.taxonomy),
    email: trimOrNull(formData.email),
    taxId: formData.taxId?.trim(),
    taxIdType: trimOrNull(formData.taxIdType),
    group: trimOrNull(formData.group),
    groupNpi: trimOrNull(formData.groupNpi),
    medicarePtan: trimOrNull(formData.medicarePtan),
    medicaidId: trimOrNull(formData.medicaidId),
    caqhId: trimOrNull(formData.caqhId),
    deaNumber: trimOrNull(formData.deaNumber)?.toUpperCase() || null,
    stateLicenseNumber: trimOrNull(formData.stateLicenseNumber),
    licenseState: resolveUsStateCode(formData.licenseState) || null,
    csrLicenseNumber: trimOrNull(formData.csrLicenseNumber),
    mobileNumber: normalizePhone(formData.mobileNumber),
    officePhone: normalizePhone(formData.officePhone),
    fax: normalizePhone(formData.fax),
    degree: trimOrNull(formData.degree),
    experience: trimOrNull(formData.experience),
    address: trimOrNull(formData.address),
    addressLine2: trimOrNull(formData.addressLine2),
    city: trimOrNull(formData.city),
    state: resolveUsStateCode(formData.state) || null,
    zip: trimOrNull(zip),
    zipPlus4: trimOrNull(zipPlus4),
    treatment: trimOrNull(formData.treatment),
    specialtyId: fkTrim(formData.specialtyId) || null,
    subSpecialtyId: fkTrim(formData.subSpecialtyId) || null,
    departmentId: fkTrim(formData.departmentId) || null,
    isActive: formData.isActive !== false,
  };

  for (const k of dateFields) {
    out[k] = formData[k] ? formData[k] : null;
  }

  return out;
}

function optionLabel(options, value) {
  if (!value) return '';
  return options.find((o) => o.value === value)?.label || value;
}

export function displayOptionLabel(options, value) {
  return optionLabel(options, value);
}

const FIELD_LABELS = {
  npi: 'NPI',
  firstName: 'First name',
  lastName: 'Last name',
  gender: 'Gender',
  taxId: 'Tax ID',
  email: 'Email',
  mobileNumber: 'Mobile number',
  officePhone: 'Office phone',
  fax: 'Fax',
  zip: 'ZIP',
  zipPlus4: 'ZIP+4',
  deaNumber: 'DEA number',
  deaEffectiveDate: 'DEA effective date',
  deaExpiryDate: 'DEA expiry date',
  stateLicenseEffectiveDate: 'License effective date',
  stateLicenseExpiryDate: 'License expiry date',
  groupNpi: 'Group NPI',
};

function requireFields(formData, keys, errors) {
  keys.forEach((key) => {
    const v = formData[key];
    if (v == null || String(v).trim() === '') {
      errors[key] = `${FIELD_LABELS[key] || key} is required`;
    }
  });
}

function validatePhoneField(formData, key, errors) {
  const result = validatePhoneNumber(formData[key]);
  if (!result.valid) {
    errors[key] = result.message;
  }
}

function datesInOrder(start, end) {
  if (!start || !end) return true;
  return new Date(end) >= new Date(start);
}

export function validateProviderStep(stepIndex, formData) {
  const errors = {};

  if (stepIndex === 0) {
    requireFields(formData, ['npi', 'firstName', 'lastName', 'gender'], errors);
    const npi = String(formData.npi || '').trim();
    if (npi && !/^\d{10}$/.test(npi)) {
      errors.npi = 'NPI must be a 10-digit number';
    }
  }

  if (stepIndex === 2) {
    const dea = String(formData.deaNumber || '').trim();
    if (dea && !/^[A-Za-z]{2}\d{7}$/.test(dea)) {
      errors.deaNumber = 'DEA number must be 2 letters followed by 7 digits';
    }
    if (!datesInOrder(formData.deaEffectiveDate, formData.deaExpiryDate)) {
      errors.deaExpiryDate = 'DEA expiry must be on or after the effective date';
    }
    if (!datesInOrder(formData.stateLicenseEffectiveDate, formData.stateLicenseExpiryDate)) {
      errors.stateLicenseExpiryDate = 'License expiry must be on or after the effective date';
    }
  }

  if (stepIndex === 3) {
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    validatePhoneField(formData, 'mobileNumber', errors);
    validatePhoneField(formData, 'officePhone', errors);
    validatePhoneField(formData, 'fax', errors);
    const zipDigits = String(formData.zip || '').replace(/\D/g, '');
    if (formData.zip && zipDigits.length !== 5 && zipDigits.length !== 9) {
      errors.zip = 'ZIP must be ##### or #####-####';
    }
    if (formData.zipPlus4 && !/^\d{4}$/.test(String(formData.zipPlus4).trim())) {
      errors.zipPlus4 = 'ZIP+4 must be 4 digits';
    }
  }

  if (stepIndex === 4) {
    requireFields(formData, ['taxId'], errors);
    const groupNpi = String(formData.groupNpi || '').trim();
    if (groupNpi && !/^\d{10}$/.test(groupNpi)) {
      errors.groupNpi = 'Group NPI must be a 10-digit number';
    }
    if (groupNpi && groupNpi === String(formData.npi || '').trim()) {
      errors.groupNpi = 'Group NPI must be different from the individual NPI';
    }
    if (formData.taxIdType === 'ein' && formData.taxId) {
      const digits = String(formData.taxId).replace(/\D/g, '');
      if (digits.length !== 9) {
        errors.taxId = 'EIN must be 9 digits (##-#######)';
      }
    }
  }

  return errors;
}

export function validateAllProviderSteps(formData) {
  return [0, 2, 3, 4].reduce((acc, step) => ({ ...acc, ...validateProviderStep(step, formData) }), {});
}

export function firstInvalidStep(formData) {
  for (const step of [0, 2, 3, 4]) {
    if (Object.keys(validateProviderStep(step, formData)).length > 0) return step;
  }
  return -1;
}

export function catalogLabel(list, id, nameKeys) {
  if (!id) return '';
  const row = list.find((item) => item.id === id);
  if (!row) return '';
  const code = row.code || row.departmentCode;
  for (const key of nameKeys) {
    if (row[key]) return code ? `${row[key]} (${code})` : row[key];
  }
  return '';
}

export function reviewValue(value) {
  if (value == null || value === '' || value === FORM_NONE) return '—';
  return value;
}

export function formatReviewState(code) {
  return code ? usStateLabel(code) : '—';
}
