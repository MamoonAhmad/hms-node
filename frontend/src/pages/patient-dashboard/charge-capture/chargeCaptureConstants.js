export const PLACE_OF_SERVICE = [
  { value: '11', label: '11 — Office' },
  { value: '12', label: '12 — Home' },
  { value: '21', label: '21 — Inpatient Hospital' },
  { value: '22', label: '22 — Outpatient Hospital' },
  { value: '23', label: '23 — Emergency Room' },
  { value: '31', label: '31 — Skilled Nursing Facility' },
  { value: '32', label: '32 — Nursing Facility' },
  { value: '81', label: '81 — Independent Laboratory' },
  { value: '99', label: '99 — Other' },
];

export function emptyDiagnosis(sequence = 1) {
  return {
    sequence,
    icd10Code: '',
    description: '',
    diagnosisCodeId: null,
    problemId: null,
    isPrimary: sequence === 1,
  };
}

export function emptyServiceLine(lineNumber = 1, serviceDate = '') {
  return {
    lineNumber,
    serviceDate: serviceDate || new Date().toISOString().slice(0, 10),
    procedureCode: '',
    codeType: 'CPT',
    description: '',
    modifier1: '',
    modifier2: '',
    modifier3: '',
    modifier4: '',
    units: 1,
    chargeAmount: '',
    diagnosisPointers: '1',
    placeOfService: '11',
  };
}

export function toDateInput(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export function mapCaptureToForm(capture) {
  if (!capture) return null;
  const dos = toDateInput(capture.dateOfService);
  return {
    placeOfService: capture.placeOfService || '11',
    dateOfService: dos,
    renderingProviderId: capture.renderingProviderId || null,
    renderingProviderNpi: capture.renderingProviderNpi || '',
    renderingProviderName: capture.renderingProviderName || '',
    billingProviderName: capture.billingProviderName || '',
    billingProviderNpi: capture.billingProviderNpi || '',
    billingProviderTaxId: capture.billingProviderTaxId || '',
    authorizationNumber: capture.authorizationNumber || '',
    referralNumber: capture.referralNumber || '',
    notes: capture.notes || '',
    diagnoses: (capture.diagnoses?.length
      ? capture.diagnoses
      : [emptyDiagnosis(1)]
    ).map((d, idx) => ({
      sequence: d.sequence || idx + 1,
      icd10Code: d.icd10Code || '',
      description: d.description || '',
      diagnosisCodeId: d.diagnosisCodeId || null,
      problemId: d.problemId || null,
      isPrimary: !!d.isPrimary || idx === 0,
    })),
    serviceLines: (capture.serviceLines?.length
      ? capture.serviceLines
      : [emptyServiceLine(1, dos)]
    ).map((l, idx) => ({
      lineNumber: l.lineNumber || idx + 1,
      serviceDate: toDateInput(l.serviceDate) || dos,
      procedureCode: l.procedureCode || '',
      codeType: l.codeType || 'CPT',
      description: l.description || '',
      modifier1: l.modifier1 || '',
      modifier2: l.modifier2 || '',
      modifier3: l.modifier3 || '',
      modifier4: l.modifier4 || '',
      units: l.units ?? 1,
      chargeAmount: l.chargeAmount === 0 || l.chargeAmount ? String(l.chargeAmount) : '',
      diagnosisPointers: l.diagnosisPointers || '1',
      placeOfService: l.placeOfService || capture.placeOfService || '11',
    })),
  };
}

export function formToPayload(form, encounterId) {
  return {
    encounterId,
    placeOfService: form.placeOfService,
    dateOfService: form.dateOfService,
    renderingProviderId: form.renderingProviderId || null,
    renderingProviderNpi: form.renderingProviderNpi || null,
    renderingProviderName: form.renderingProviderName || null,
    billingProviderName: form.billingProviderName || null,
    billingProviderNpi: form.billingProviderNpi || null,
    billingProviderTaxId: form.billingProviderTaxId || null,
    authorizationNumber: form.authorizationNumber || null,
    referralNumber: form.referralNumber || null,
    notes: form.notes || null,
    diagnoses: form.diagnoses.map((d, idx) => ({
      sequence: idx + 1,
      icd10Code: d.icd10Code.trim(),
      description: d.description?.trim() || null,
      diagnosisCodeId: d.diagnosisCodeId || null,
      problemId: d.problemId || null,
      isPrimary: idx === 0 || !!d.isPrimary,
    })),
    serviceLines: form.serviceLines.map((l, idx) => ({
      lineNumber: idx + 1,
      serviceDate: l.serviceDate || form.dateOfService,
      procedureCode: l.procedureCode.trim(),
      codeType: l.codeType || 'CPT',
      description: l.description?.trim() || null,
      modifier1: l.modifier1 || null,
      modifier2: l.modifier2 || null,
      modifier3: l.modifier3 || null,
      modifier4: l.modifier4 || null,
      units: Number(l.units) || 1,
      chargeAmount: Number(l.chargeAmount) || 0,
      diagnosisPointers: String(l.diagnosisPointers || '1'),
      placeOfService: l.placeOfService || form.placeOfService,
    })),
  };
}
