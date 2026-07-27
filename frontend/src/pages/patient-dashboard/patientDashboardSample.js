/** Sample chart data for /patient-dashboard and department encounter demos. */

import { getDepartmentBySlug } from '@/pages/others/departmentEncounterDepartments';

export const SAMPLE_PATIENT_ID = 'sample';

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Demo patient on Encounters listing — opens a chart with every specialty tab visible. */
export const SAMPLE_PATIENT = {
  id: SAMPLE_PATIENT_ID,
  mrn: 'MRN-SAMPLE-0001',
  firstName: 'Sample',
  middleName: null,
  lastName: 'Patient',
  preferredName: 'Sample Patient',
  dateOfBirth: '2018-06-12T00:00:00.000Z',
  gender: 'Female',
  genderIdentity: 'Female',
  contactNumber: '(555) 123-4567',
  cellPhone: '(555) 123-4567',
  email: 'sample.patient@email.example',
  address: '123 Oak Street',
  city: 'Springfield',
  state: 'IL',
  zip: '62701',
  language: 'English',
  interpreterRequired: true,
  interpreterLanguageRequired: 'Spanish',
  generalNotes: null,
  policyNumber: 'BC123456',
  copay: 25,
  billingType: 'insurance',
  insuranceProvider: { name: 'Blue Cross PPO' },
  insuranceList: [
    {
      insuranceTypeKey: 'primary',
      payerName: 'Blue Cross PPO',
      memberId: 'BC123456',
    },
  ],
  emergencyContactName: 'Jordan Patient',
  emergencyContactRelationship: 'Parent',
  emergencyContactNumber: '(555) 987-6543',
  emergencyContactEmail: 'jordan.patient@email.example',
  emergencyContactAddress: '123 Oak Street',
  emergencyContactCity: 'Springfield',
  emergencyContactState: 'IL',
  emergencyContactZip: '62701',
  noKnownDrugAllergies: false,
  primaryCarePhysician: 'Dr. Robert Williams, MD',
  /** Bypass department/age/gender gates so every chart tab is available. */
  showAllChartTabs: true,
};

/** Demo row(s) prepended to the main Encounters worklist. */
export function getEncountersListSampleRows() {
  const patient = { ...SAMPLE_PATIENT };
  return [
    {
      id: 'sample-appt-encounters-1',
      encounterNumber: 'ENC-DEMO-SAMPLE-001',
      appointmentDate: todayKey(),
      appointmentTime: '10:30 AM',
      appointmentType: 'Office Visit',
      visitReason: 'Full chart demo — all specialty tabs',
      provider: 'Dr. Sarah Chen, MD',
      department: 'Internal Medicine',
      status: 'In Progress',
      isDemo: true,
      patient,
    },
  ];
}

function samplePatientForDepartment(dept) {
  // Specialty department demos keep department-gated tabs (not the all-tabs showcase).
  const base = {
    ...SAMPLE_PATIENT,
    showAllChartTabs: false,
  };
  if (dept?.slug === 'pediatrics') {
    return { ...base, mrn: 'MRN-PEDS-0042' };
  }
  return base;
}

/** Two demo encounters for a specialty department listing + sample chart. */
export function getDepartmentSampleEncounters(department) {
  const dept =
    typeof department === 'string'
      ? getDepartmentBySlug(department) || { name: 'Internal Medicine', slug: 'internal-medicine' }
      : department || { name: 'Internal Medicine', slug: 'internal-medicine' };
  const patient = samplePatientForDepartment(dept);
  const focus = dept.focus || 'Office visit';
  const reason =
    Array.isArray(dept.clinicalChecks) && dept.clinicalChecks[0]
      ? dept.clinicalChecks[0]
      : focus;

  return [
    {
      id: `sample-appt-${dept.slug}-1`,
      encounterNumber: `ENC-DEMO-${(dept.slug || 'dept').slice(0, 8).toUpperCase()}-001`,
      appointmentDate: todayKey(),
      appointmentTime: '10:30 AM',
      appointmentType: 'Office Visit',
      visitReason: reason,
      provider: 'Dr. Sarah Chen, MD',
      department: dept.name,
      status: 'In Progress',
      isDemo: true,
      patient,
    },
    {
      id: `sample-appt-${dept.slug}-2`,
      encounterNumber: `ENC-DEMO-${(dept.slug || 'dept').slice(0, 8).toUpperCase()}-002`,
      appointmentDate: todayKey(),
      appointmentTime: '2:15 PM',
      appointmentType: 'Follow-up',
      visitReason: focus,
      provider: 'Dr. Sarah Chen, MD',
      department: dept.name,
      status: 'Checked In',
      isDemo: true,
      patient,
    },
  ];
}

export function getSampleChartData(options = {}) {
  const department =
    (options.departmentSlug && getDepartmentBySlug(options.departmentSlug)) ||
    options.department ||
    null;

  const appointments = department
    ? getDepartmentSampleEncounters(department).map(({ patient, isDemo, ...appt }) => appt)
    : getEncountersListSampleRows().map(({ patient, isDemo, ...appt }) => appt);

  const patient = department
    ? samplePatientForDepartment(department)
    : { ...SAMPLE_PATIENT };

  const orders = [];
  const chartSummary = {
    allergies: [
      { id: 'a1', allergenName: 'Penicillin', reaction: 'Rash', severity: 'Moderate' },
    ],
    noKnownDrugAllergies: false,
    provider: {
      name: 'Dr. Sarah Chen, MD',
      specialty: department?.name || 'Internal Medicine',
    },
  };

  return {
    patient,
    appointments,
    orders,
    chartSummary,
    defaultAppointmentId: appointments[0]?.id || 'sample-appt-encounters-1',
  };
}
