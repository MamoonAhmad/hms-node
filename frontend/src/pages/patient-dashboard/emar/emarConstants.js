import { STATUS_SOFT } from '@/lib/statusColors';

export const EMAR_TABS = [
  { id: 'active', label: 'Active' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'administered', label: 'Administered' },
  { id: 'prn', label: 'PRN' },
  { id: 'missed', label: 'Missed' },
  { id: 'refused', label: 'Refused' },
  { id: 'discontinued', label: 'Discontinued' },
  { id: 'samples', label: 'Samples' },
  { id: 'history', label: 'History' },
];

export const MAR_STATUS_BADGE = {
  Pending: STATUS_SOFT.muted,
  Due: STATUS_SOFT.warning,
  Administered: STATUS_SOFT.success,
  Completed: STATUS_SOFT.success,
  Missed: STATUS_SOFT.danger,
  Refused: STATUS_SOFT.danger,
  Held: STATUS_SOFT.warning,
  Cancelled: STATUS_SOFT.muted,
  Discontinued: STATUS_SOFT.muted,
  Expired: STATUS_SOFT.danger,
};

export const ADMINISTRATION_STATUS_OPTIONS = [
  'Administered',
  'Held',
  'Refused',
  'Missed',
  'Not Available',
  'Delayed',
];

export const HOLD_REASONS = [
  'Clinical Decision',
  'Low Blood Pressure',
  'Abnormal Lab Result',
  'Provider Request',
  'Patient Condition',
  'Other',
];

export const REFUSAL_REASONS = [
  'Patient Refused',
  'Religious Reasons',
  'Financial Reasons',
  'Side Effects',
  'Other',
];

export const MISSED_REASONS = [
  'Patient Not Available',
  'Medication Not Available',
  'Clinical Emergency',
  'Scheduling Conflict',
  'Other',
];

export const ADMINISTRATION_SITES = [
  'Left Arm',
  'Right Arm',
  'Left Thigh',
  'Right Thigh',
  'Left Deltoid',
  'Right Deltoid',
  'Oral',
  'Other',
];

export const SYMPTOM_SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];

export const HANDLING_LABELS = {
  give_in_clinic: 'Give in Clinic',
  sample_given: 'Sample Given',
};

export const TIMELINE_EVENT_LABELS = {
  medication_ordered: 'Medication Ordered',
  medication_administered: 'Medication Administered',
  medication_held: 'Medication Held',
  medication_refused: 'Medication Refused',
  medication_missed: 'Medication Missed',
  medication_discontinued: 'Medication Discontinued',
  medication_completed: 'Medication Completed',
  medication_delayed: 'Medication Delayed',
  medication_signed: 'Medication Signed',
  medication_verified: 'Medication Verified',
  medication_cancelled: 'Medication Cancelled',
};

export const FIVE_RIGHTS = [
  { key: 'rightPatient', label: 'Right Patient' },
  { key: 'rightMedication', label: 'Right Medication' },
  { key: 'rightDose', label: 'Right Dose' },
  { key: 'rightRoute', label: 'Right Route' },
  { key: 'rightTime', label: 'Right Time' },
];
