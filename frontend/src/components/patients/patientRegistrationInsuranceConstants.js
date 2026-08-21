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

export const INSURANCE_TYPE_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  tertiary: 'Tertiary',
};

export function buildInsuranceListEntry(formData, getPayerName) {
  const typeKey = formData.insuranceType || 'primary';
  const coverageDate = formData.coverageStartDate || formData.coverageEndDate || '';
  const fallbackDate = coverageDate || new Date().toISOString().slice(0, 10);
  return {
    id: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    insuranceTypeKey: typeKey,
    insuranceType: INSURANCE_TYPE_LABELS[typeKey] || typeKey,
    insuranceProviderId: formData.insuranceCompany || null,
    insuranceCompany: formData.insuranceCompany || null,
    payerName: getPayerName?.(formData.insuranceCompany) || '—',
    memberId: formData.policyNumber || '',
    policyNumber: formData.policyNumber || '',
    groupNumber: formData.groupNumber || '',
    planName: formData.planName || '',
    policyType: formData.policyType || '',
    coverageDate: fallbackDate,
    effectiveDate: formData.coverageStartDate || fallbackDate,
    coverageStartDate: formData.coverageStartDate || null,
    coverageEndDate: formData.coverageEndDate || null,
    copay: formData.copay || null,
    deductible: formData.deductible || null,
    coinsurancePercentage: formData.coinsurancePercentage || null,
    authorizationRequired: formData.authorizationRequired || null,
    authorizationNumber: formData.authorizationNumber || null,
    claimNumber: formData.claimNumber || null,
    subscriberFirstName: formData.subscriberFirstName || null,
    subscriberLastName: formData.subscriberLastName || null,
    subscriberName: formData.subscriberName || null,
    subscriberRelationship: formData.subscriberRelationship || null,
    subscriberGender: formData.subscriberGender || null,
    subscriberDateOfBirth: formData.subscriberDateOfBirth || null,
    subscriberPhone: formData.subscriberPhone || null,
    subscriberEmail: formData.subscriberEmail || null,
    subscriberSsnLast4: formData.subscriberSsnLast4 || null,
    subscriberEmployer: formData.subscriberEmployer || null,
    subscriberAddress: formData.subscriberAddress || null,
    subscriberCity: formData.subscriberCity || null,
    subscriberState: formData.subscriberState || null,
    subscriberZip: formData.subscriberZip || null,
  };
}

export function copySubscriberFromPatient(formData) {
  return {
    subscriberFirstName: formData.firstName || '',
    subscriberLastName: formData.lastName || '',
    subscriberName: [formData.firstName, formData.lastName].filter(Boolean).join(' '),
    subscriberGender: formData.gender || '',
    subscriberDateOfBirth: formData.dateOfBirth || '',
    subscriberPhone: formData.cellPhone || formData.homePhone || formData.contactNumber || '',
    subscriberEmail: formData.email || '',
    subscriberSsnLast4: formData.ssnLast4 || '',
    subscriberAddress: formData.address || '',
    subscriberCity: formData.city || '',
    subscriberState: formData.state || '',
    subscriberZip: formData.zip || '',
  };
}

export const SELF_PAY_PAYMENT_METHOD_LABELS = Object.fromEntries(
  SELF_PAY_PAYMENT_METHOD_OPTIONS.filter((o) => o.value !== PAYMENT_METHOD_SELECT_VALUE).map(
    (o) => [o.value, o.label],
  ),
);
