export const ICD_SLOT_COUNT = 12;

export function emptyInsuranceDetails() {
  return {
    memberId: '',
    policyType: '',
    copayDue: '',
    groupNumber: '',
    claimControlRef: '',
    authorizationNumber: '',
    referralType: 'None',
  };
}

export function middleInitial(middleName) {
  if (!middleName) return '';
  const trimmed = String(middleName).trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '';
}

export function formatPatientDisplayName(patient) {
  if (!patient) return '';
  const mi = middleInitial(patient.middleName);
  return [patient.firstName, mi || null, patient.lastName].filter(Boolean).join(' ');
}

export function formatProviderDisplayName(provider) {
  if (!provider) return '';
  if (typeof provider === 'string') return provider;
  if (provider.name) return provider.name;
  const mi = middleInitial(provider.middleName);
  return [provider.firstName, mi || null, provider.lastName].filter(Boolean).join(' ');
}

function normalizeTier(type) {
  const t = String(type || '').toLowerCase();
  if (t.includes('secondary')) return 'secondary';
  if (t.includes('tertiary')) return 'tertiary';
  if (t.includes('primary')) return 'primary';
  return t || 'primary';
}

export function mapInsuranceDetails(ins) {
  if (!ins) return emptyInsuranceDetails();
  const auth = ins.authorizationNumber || '';
  const copay =
    ins.copayDue != null && ins.copayDue !== ''
      ? String(ins.copayDue)
      : ins.copay != null && ins.copay !== ''
        ? Number(ins.copay).toFixed(2)
        : '';
  return {
    memberId: ins.memberId || '',
    policyType: ins.policyType || '',
    copayDue: copay,
    groupNumber: ins.groupNumber || '',
    claimControlRef: ins.claimControlRef || '',
    authorizationNumber: auth,
    referralType: ins.referralType || (auth ? 'Prior Auth Number' : 'None'),
  };
}

/** Map patient.insuranceList / API insurance rows into CMS form insurance state. */
export function mapPatientInsurances(insuranceList = []) {
  const rows = (insuranceList || []).map((ins) => ({
    ...ins,
    insuranceType: normalizeTier(ins.insuranceType || ins.insuranceTypeKey),
    payerName: ins.payerName || ins.insuranceProvider?.name || ins.planName || '',
  }));

  const pick = (tier) => rows.find((r) => r.insuranceType === tier) || null;

  return {
    primary: pick('primary'),
    secondary: pick('secondary'),
    tertiary: pick('tertiary'),
  };
}

export function padIcdCodes(codes = []) {
  const next = Array.from({ length: ICD_SLOT_COUNT }, () => '');
  (codes || []).slice(0, ICD_SLOT_COUNT).forEach((code, i) => {
    next[i] = code || '';
  });
  return next;
}

export function icdCodesFromProblems(problems = []) {
  return (problems || [])
    .filter((p) => {
      const status = String(p.status || '').toLowerCase();
      const clinical = String(p.clinicalStatus || '').toLowerCase();
      return status === 'active' || clinical === 'active';
    })
    .map((p) => p.icd10Code || p.diagnosis?.code || '')
    .filter(Boolean)
    .slice(0, ICD_SLOT_COUNT);
}
