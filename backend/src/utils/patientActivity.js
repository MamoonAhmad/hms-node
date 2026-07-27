const PATIENT_FIELD_SECTIONS = {
  firstName: { section: 'Demographics', tab: 'Demographics' },
  middleName: { section: 'Demographics', tab: 'Demographics' },
  lastName: { section: 'Demographics', tab: 'Demographics' },
  dateOfBirth: { section: 'Demographics', tab: 'Demographics' },
  gender: { section: 'Demographics', tab: 'Demographics' },
  ssn: { section: 'Demographics', tab: 'Demographics' },
  email: { section: 'Demographics', tab: 'Demographics' },
  cellPhone: { section: 'Demographics', tab: 'Demographics' },
  address: { section: 'Demographics', tab: 'Demographics' },
  ethnicity: { section: 'Demographics', tab: 'Demographics' },
  race: { section: 'Demographics', tab: 'Demographics' },
  emergencyContactName: { section: 'Contacts', tab: 'Contacts' },
  emergencyContactNumber: { section: 'Contacts', tab: 'Contacts' },
  guarantorName: { section: 'Contacts', tab: 'Contacts' },
  billingType: { section: 'Insurance', tab: 'Insurance Info' },
  insuranceProviderId: { section: 'Insurance', tab: 'Insurance Info' },
  registrationStatus: { section: 'Registration', tab: 'Review' },
};

const FIELD_LABELS = {
  firstName: 'First Name',
  middleName: 'Middle Name',
  lastName: 'Last Name',
  dateOfBirth: 'Date of Birth',
  gender: 'Gender',
  ssn: 'SSN (PHI)',
  email: 'Email',
  cellPhone: 'Cell Phone',
  address: 'Address',
  ethnicity: 'Ethnicity',
  race: 'Race',
  billingType: 'Billing Type',
  registrationStatus: 'Registration Status',
};

function formatLogValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function diffPatientFields(before, after, keys) {
  const changes = [];
  for (const key of keys) {
    if (after[key] === undefined) continue;
    const prev = formatLogValue(before?.[key]);
    const next = formatLogValue(after[key]);
    if (prev !== next) {
      const meta = PATIENT_FIELD_SECTIONS[key] || { section: 'Patient', tab: 'Patient' };
      changes.push({
        field: key,
        label: FIELD_LABELS[key] || key,
        section: meta.section,
        tabName: meta.tab,
        previousValue: prev,
        newValue: next,
      });
    }
  }
  return changes;
}

module.exports = {
  PATIENT_FIELD_SECTIONS,
  FIELD_LABELS,
  diffPatientFields,
  formatLogValue,
};
