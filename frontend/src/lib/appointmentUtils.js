import { calcAge, formatDob } from '@/pages/patient-dashboard/patientChartUtils';

export const HIDDEN_TIMELINE_STATUSES = ['Cancelled', 'No Show', 'No-Show', 'Deleted'];

export function isHiddenFromTimeline(status) {
  return HIDDEN_TIMELINE_STATUSES.includes(status);
}

export function formatPatientListName(patient) {
  if (!patient) return '';
  const parts = [patient.lastName, [patient.firstName, patient.middleName].filter(Boolean).join(' ')]
    .filter(Boolean);
  return parts.join(', ');
}

export function formatPatientDemographics(patient) {
  if (!patient) return '';
  const dob = formatDob(patient.dateOfBirth);
  const age = calcAge(patient.dateOfBirth);
  const gender = patient.gender || '—';
  const agePart = age != null ? `${age} yrs` : '—';
  return `${dob}, ${agePart}, ${gender}`;
}

export function buildPatientSearchOption(patient) {
  const name = formatPatientListName(patient);
  const demo = formatPatientDemographics(patient);
  return {
    value: patient.id,
    label: name,
    displayLabel: `${name} ${patient.mrn || ''} ${patient.firstName || ''} ${patient.lastName || ''} ${demo}`,
    meta: {
      line1: name,
      line2: patient.mrn || '',
      line3: demo,
    },
  };
}

export function formatProviderListName(provider) {
  if (!provider) return '';
  const parts = [provider.lastName, [provider.firstName, provider.middleName].filter(Boolean).join(' ')]
    .filter(Boolean);
  return parts.join(', ');
}

export function buildProviderSearchOption(provider) {
  const name = formatProviderListName(provider);
  const npi = provider.npi || '';
  return {
    value: provider.id,
    label: name,
    displayLabel: `${name} ${npi} ${provider.firstName || ''} ${provider.lastName || ''}`,
    meta: { line1: name, line2: npi ? `NPI: ${npi}` : '' },
  };
}

export function patientMatchesSearch(patient, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const first = (patient.firstName || '').toLowerCase();
  const last = (patient.lastName || '').toLowerCase();
  const mrn = (patient.mrn || '').toLowerCase();
  const full1 = `${first} ${last}`;
  const full2 = `${last} ${first}`;
  return (
    first.includes(q) ||
    last.includes(q) ||
    mrn.includes(q) ||
    full1.includes(q) ||
    full2.includes(q)
  );
}

export function providerMatchesSearch(provider, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const first = (provider.firstName || '').toLowerCase();
  const last = (provider.lastName || '').toLowerCase();
  const npi = (provider.npi || '').toLowerCase();
  return first.includes(q) || last.includes(q) || npi.includes(q);
}

export function formatAppointmentDateTime(dateStr, timeStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  if (!timeStr) return date;
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${date} at ${displayHour}:${minutes} ${ampm}`;
}
