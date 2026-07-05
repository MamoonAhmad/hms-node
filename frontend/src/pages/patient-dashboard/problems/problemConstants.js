export const PROBLEM_STATUS_TABS = [
  { id: 'All', label: 'All' },
  { id: 'Active', label: 'Active' },
  { id: 'Inactive', label: 'Inactive' },
  { id: 'Resolved', label: 'Resolved' },
];

export const PROBLEM_STATUSES = ['Active', 'Inactive', 'Resolved'];

export const CLINICAL_STATUSES = [
  'None',
  'Active',
  'Recurrence',
  'Relapse',
  'Remission',
  'Resolved',
];

export const VERIFICATION_STATUSES = [
  'None',
  'Unconfirmed',
  'Provisional',
  'Differential',
  'Confirmed',
  'Refuted',
  'Entered in Error',
];

export function emptyProblemForm() {
  return {
    diagnosisId: '',
    icd10Code: '',
    diagnosisDescription: '',
    status: 'Active',
    clinicalStatus: 'None',
    verificationStatus: 'None',
    onsetDate: '',
    resolvedDate: '',
    notes: '',
  };
}

export function problemToForm(problem) {
  if (!problem) return emptyProblemForm();
  return {
    diagnosisId: problem.diagnosisId || '',
    icd10Code: problem.icd10Code || '',
    diagnosisDescription: problem.diagnosisDescription || '',
    status: problem.status || 'Active',
    clinicalStatus: problem.clinicalStatus || 'None',
    verificationStatus: problem.verificationStatus || 'None',
    onsetDate: problem.onsetDate || '',
    resolvedDate: problem.resolvedDate || '',
    notes: problem.notes || '',
  };
}

export function formatProblemDate(isoDate) {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${m}/${d}/${y}`;
}

export function formatAuditDateTime(isoDateTime) {
  if (!isoDateTime) return null;
  const dt = new Date(isoDateTime);
  const date = dt.toLocaleDateString();
  const time = dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${date}, ${time}`;
}
