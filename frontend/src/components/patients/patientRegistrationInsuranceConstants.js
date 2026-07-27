/** Sentinel value for unset billing type in Select (stored as empty string in form). */
export const BILLING_TYPE_SELECT_VALUE = 'select';

export const INSURANCE_BILLING_TYPE_OPTIONS = [
  { value: BILLING_TYPE_SELECT_VALUE, label: 'Select Type' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'self-pay', label: 'Self Pay' },
];

/** Sentinel for unset payment method in Select (stored as empty string in form). */
export const PAYMENT_METHOD_SELECT_VALUE = 'select';

export const SELF_PAY_PAYMENT_METHOD_OPTIONS = [
  { value: PAYMENT_METHOD_SELECT_VALUE, label: 'Select mode of payment' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

export const SELF_PAY_PAYMENT_METHOD_LABELS = Object.fromEntries(
  SELF_PAY_PAYMENT_METHOD_OPTIONS.filter((o) => o.value !== PAYMENT_METHOD_SELECT_VALUE).map(
    (o) => [o.value, o.label],
  ),
);

export const INSURANCE_RANK_ORDER = ['primary', 'secondary', 'tertiary'];

export const INSURANCE_TYPE_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  tertiary: 'Tertiary',
};

export const INSURANCE_ENTRY_FIELD_KEYS = [
  'insuranceType',
  'insuranceCompany',
  'policyType',
  'planName',
  'policyNumber',
  'groupNumber',
  'subscriberFirstName',
  'subscriberLastName',
  'subscriberRelationship',
  'subscriberName',
  'subscriberGender',
  'subscriberDateOfBirth',
  'subscriberPhone',
  'subscriberEmail',
  'subscriberSsnLast4',
  'subscriberEmployer',
  'subscriberAddress',
  'subscriberCity',
  'subscriberState',
  'subscriberZip',
  'coverageStartDate',
  'coverageEndDate',
  'copay',
  'deductible',
  'coinsurancePercentage',
  'authorizationRequired',
  'authorizationNumber',
];

export function normalizeInsuranceTypeKey(value) {
  const raw = String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (raw.includes('secondary')) return 'secondary';
  if (raw.includes('tertiary')) return 'tertiary';
  if (raw.includes('primary')) return 'primary';
  return INSURANCE_RANK_ORDER.includes(raw) ? raw : '';
}

export function createEmptyInsuranceEntry(typeKey) {
  const key = normalizeInsuranceTypeKey(typeKey) || 'primary';
  return {
    id: `ins-${key}`,
    insuranceTypeKey: key,
    insuranceType: INSURANCE_TYPE_LABELS[key],
    insuranceCompany: '',
    policyType: '',
    planName: '',
    policyNumber: '',
    groupNumber: '',
    subscriberFirstName: '',
    subscriberLastName: '',
    subscriberRelationship: '',
    subscriberName: '',
    subscriberGender: '',
    subscriberDateOfBirth: '',
    subscriberPhone: '',
    subscriberEmail: '',
    subscriberSsnLast4: '',
    subscriberEmployer: '',
    subscriberAddress: '',
    subscriberCity: '',
    subscriberState: '',
    subscriberZip: '',
    coverageStartDate: '',
    coverageEndDate: '',
    copay: '',
    deductible: '',
    coinsurancePercentage: '',
    authorizationRequired: '',
    authorizationNumber: '',
  };
}

export function createEmptyInsuranceForms() {
  return {
    primary: createEmptyInsuranceEntry('primary'),
    secondary: createEmptyInsuranceEntry('secondary'),
    tertiary: createEmptyInsuranceEntry('tertiary'),
  };
}

function dateOnly(value) {
  if (!value) return '';
  return String(value).split('T')[0];
}

export function pickInsuranceFieldsFromFormData(formData = {}) {
  const entry = createEmptyInsuranceEntry(formData.insuranceType || 'primary');
  INSURANCE_ENTRY_FIELD_KEYS.forEach((key) => {
    if (formData[key] != null && formData[key] !== '') {
      entry[key] = formData[key];
    }
  });
  entry.insuranceCompany =
    formData.insuranceCompany || formData.insuranceProviderId || entry.insuranceCompany;
  entry.policyNumber = formData.policyNumber || formData.memberId || entry.policyNumber;
  entry.subscriberDateOfBirth = dateOnly(formData.subscriberDateOfBirth);
  entry.coverageStartDate = dateOnly(formData.coverageStartDate);
  entry.coverageEndDate = dateOnly(formData.coverageEndDate);
  entry.insuranceTypeKey = 'primary';
  entry.insuranceType = INSURANCE_TYPE_LABELS.primary;
  return entry;
}

export function mapInsuranceListItemToEntry(item = {}, fallbackType = 'primary') {
  const typeKey = normalizeInsuranceTypeKey(item.insuranceTypeKey || item.insuranceType) || fallbackType;
  const entry = createEmptyInsuranceEntry(typeKey);
  return {
    ...entry,
    id: item.id || entry.id,
    insuranceCompany: item.insuranceCompany || item.insuranceProviderId || item.payerId || '',
    policyType: item.policyType || '',
    planName: item.planName || '',
    policyNumber: item.policyNumber || item.memberId || '',
    groupNumber: item.groupNumber || '',
    subscriberFirstName: item.subscriberFirstName || '',
    subscriberLastName: item.subscriberLastName || '',
    subscriberRelationship: item.subscriberRelationship || item.relationshipToPatient || '',
    subscriberName: item.subscriberName || '',
    subscriberGender: item.subscriberGender || '',
    subscriberDateOfBirth: dateOnly(item.subscriberDateOfBirth),
    subscriberPhone: item.subscriberPhone || '',
    subscriberEmail: item.subscriberEmail || '',
    subscriberSsnLast4: item.subscriberSsnLast4 || '',
    subscriberEmployer: item.subscriberEmployer || '',
    subscriberAddress: item.subscriberAddress || item.subscriberStreetAddress || '',
    subscriberCity: item.subscriberCity || '',
    subscriberState: item.subscriberState || '',
    subscriberZip: item.subscriberZip || '',
    coverageStartDate: dateOnly(item.coverageStartDate || item.effectiveDate || item.coverageDate),
    coverageEndDate: dateOnly(item.coverageEndDate),
    copay: item.copay ?? '',
    deductible: item.deductible ?? '',
    coinsurancePercentage: item.coinsurancePercentage ?? '',
    authorizationRequired:
      item.authorizationRequired || (item.authorizationNumber ? 'yes' : ''),
    authorizationNumber: item.authorizationNumber || '',
  };
}

export function hydrateInsuranceForms(insuranceList = [], formData = {}) {
  const forms = createEmptyInsuranceForms();

  (insuranceList || []).forEach((item) => {
    const typeKey = normalizeInsuranceTypeKey(item?.insuranceTypeKey || item?.insuranceType);
    if (!typeKey || !forms[typeKey]) return;
    forms[typeKey] = mapInsuranceListItemToEntry(item, typeKey);
  });

  const primaryHasData = !!(forms.primary.insuranceCompany || forms.primary.policyNumber);
  if (!primaryHasData && (formData.insuranceCompany || formData.insuranceProviderId || formData.policyNumber)) {
    forms.primary = {
      ...forms.primary,
      ...pickInsuranceFieldsFromFormData(formData),
      id: forms.primary.id,
    };
  }

  return forms;
}

export function entryHasData(entry) {
  if (!entry) return false;
  return !!(
    entry.insuranceCompany ||
    entry.insuranceProviderId ||
    entry.policyNumber ||
    entry.memberId ||
    entry.planName ||
    entry.groupNumber ||
    entry.subscriberFirstName ||
    entry.subscriberLastName
  );
}

export function buildInsuranceListFromForms(forms, getPayerName = () => '') {
  return INSURANCE_RANK_ORDER.map((key) => {
    const entry = forms?.[key];
    if (!entryHasData(entry)) return null;

    const providerId = entry.insuranceCompany || entry.insuranceProviderId || '';
    const policyNumber = entry.policyNumber || entry.memberId || '';
    const coverageDate = entry.coverageStartDate || entry.coverageEndDate || '';
    const toOptionalNumber = (value) => {
      if (value === '' || value === null || value === undefined) return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };

    return {
      ...entry,
      id: entry.id || `ins-${key}`,
      insuranceTypeKey: key,
      insuranceType: INSURANCE_TYPE_LABELS[key],
      insuranceCompany: providerId,
      insuranceProviderId: providerId || null,
      payerName: (typeof getPayerName === 'function' ? getPayerName(providerId) : '') || entry.payerName || '—',
      memberId: policyNumber,
      policyNumber,
      coverageDate: coverageDate || null,
      effectiveDate: entry.coverageStartDate || coverageDate || null,
      copay: toOptionalNumber(entry.copay),
      deductible: toOptionalNumber(entry.deductible),
      coinsurancePercentage: toOptionalNumber(entry.coinsurancePercentage),
      authorizationNumber:
        entry.authorizationRequired === 'no' ? null : entry.authorizationNumber || null,
    };
  }).filter(Boolean);
}

export function applyInsuranceEntryToFormData(formData, entry) {
  if (!entry) return formData;
  const next = { ...formData };
  INSURANCE_ENTRY_FIELD_KEYS.forEach((key) => {
    next[key] = entry[key] ?? '';
  });
  next.insuranceType = 'primary';
  return next;
}
