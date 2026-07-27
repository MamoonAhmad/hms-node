/** Shared outpatient encounter workflow tabs and stage resolution. */

import { ENCOUNTER_VISIT_STATUS } from './encounterVisitStatus';

export const ENCOUNTER_WORKFLOW_TABS = [
  { id: 'all', label: 'All Patients' },
  { id: 'my-patients', label: 'My Patients' },
  { id: 'ready-for-intake', label: 'Ready for Intake' },
  { id: 'ready-for-provider', label: 'Ready for Provider' },
  { id: 'ready-for-checkout', label: 'Ready for Checkout' },
  { id: 'ready-for-coding', label: 'Ready for Coding' },
];

export const WORKFLOW_STAGE = {
  READY_FOR_INTAKE: 'ready-for-intake',
  READY_FOR_PROVIDER: 'ready-for-provider',
  READY_FOR_CHECKOUT: 'ready-for-checkout',
  READY_FOR_CODING: 'ready-for-coding',
};

export const NURSING_STATUS = {
  CHECK_IN: 'Check-In',
  VITALS_PENDING: 'Vitals Pending',
  ASSESSMENT_IN_PROGRESS: 'Assessment In Progress',
  ASSESSMENT_DONE: 'Assessment Done',
  READY_FOR_PROVIDER: 'Ready for Provider',
  WITH_PROVIDER: 'With Provider',
  PROVIDER_OUT: 'Provider Out',
  READY_FOR_CHECKOUT: 'Ready for Checkout',
  READY_FOR_CODING: 'Ready for Coding',
  DISCHARGED: 'Discharged/Cleanup',
};

const INTAKE_NURSING_STATUSES = new Set([
  NURSING_STATUS.CHECK_IN,
  NURSING_STATUS.VITALS_PENDING,
  NURSING_STATUS.ASSESSMENT_IN_PROGRESS,
  NURSING_STATUS.ASSESSMENT_DONE,
]);

const APPOINTMENT_TO_NURSING_STATUS = {
  Scheduled: NURSING_STATUS.CHECK_IN,
  'Checked In': NURSING_STATUS.VITALS_PENDING,
  'Checked-In': NURSING_STATUS.VITALS_PENDING,
  'In Intake': NURSING_STATUS.ASSESSMENT_IN_PROGRESS,
  'In Progress': NURSING_STATUS.WITH_PROVIDER,
  'With Provider': NURSING_STATUS.WITH_PROVIDER,
  'Provider Out': NURSING_STATUS.PROVIDER_OUT,
  'Checked Out': NURSING_STATUS.READY_FOR_CODING,
  Completed: NURSING_STATUS.READY_FOR_CODING,
  'Visit Completed': NURSING_STATUS.READY_FOR_CODING,
  Rescheduled: NURSING_STATUS.CHECK_IN,
};

export function mapAppointmentStatusToNursingStatus(status, eventStatus) {
  if (status === 'In Progress' && eventStatus === 'Roomed') {
    return NURSING_STATUS.ASSESSMENT_IN_PROGRESS;
  }
  if (status === 'Checked In' || status === 'Checked-In') {
    return NURSING_STATUS.VITALS_PENDING;
  }
  return APPOINTMENT_TO_NURSING_STATUS[status] || NURSING_STATUS.CHECK_IN;
}

/** Maps appointment → workflow tab id for list filtering. */
export function resolveEncounterWorkflowStage(appointment) {
  const status = appointment?.status;
  const eventStatus = appointment?.eventStatus;
  const nursingStatus = mapAppointmentStatusToNursingStatus(status, eventStatus);

  if (
    status === ENCOUNTER_VISIT_STATUS.CHECKED_OUT ||
    status === ENCOUNTER_VISIT_STATUS.VISIT_COMPLETED ||
    status === ENCOUNTER_VISIT_STATUS.COMPLETED ||
    nursingStatus === NURSING_STATUS.READY_FOR_CODING
  ) {
    return WORKFLOW_STAGE.READY_FOR_CODING;
  }
  if (status === ENCOUNTER_VISIT_STATUS.PROVIDER_OUT || nursingStatus === NURSING_STATUS.PROVIDER_OUT) {
    return WORKFLOW_STAGE.READY_FOR_CHECKOUT;
  }
  if (
    status === ENCOUNTER_VISIT_STATUS.IN_PROGRESS &&
    (eventStatus === 'Roomed' || eventStatus === 'Checked In')
  ) {
    return WORKFLOW_STAGE.READY_FOR_INTAKE;
  }
  if (
    status === ENCOUNTER_VISIT_STATUS.WITH_PROVIDER ||
    status === ENCOUNTER_VISIT_STATUS.IN_PROGRESS ||
    nursingStatus === NURSING_STATUS.WITH_PROVIDER
  ) {
    return WORKFLOW_STAGE.READY_FOR_PROVIDER;
  }
  if (
    status === ENCOUNTER_VISIT_STATUS.CHECKED_IN ||
    status === ENCOUNTER_VISIT_STATUS.IN_INTAKE ||
    INTAKE_NURSING_STATUSES.has(nursingStatus)
  ) {
    return WORKFLOW_STAGE.READY_FOR_INTAKE;
  }
  if (nursingStatus === NURSING_STATUS.READY_FOR_PROVIDER) {
    return WORKFLOW_STAGE.READY_FOR_PROVIDER;
  }
  if (nursingStatus === NURSING_STATUS.READY_FOR_CHECKOUT) {
    return WORKFLOW_STAGE.READY_FOR_CHECKOUT;
  }

  return WORKFLOW_STAGE.READY_FOR_INTAKE;
}

export function matchesWorkflowTab({ workflowStage, nurseId, assignedToId, providerId }, tabId, userId) {
  if (tabId === 'all') return true;
  if (tabId === 'my-patients') {
    if (!userId) return false;
    return nurseId === userId || assignedToId === userId || providerId === userId;
  }
  return workflowStage === tabId;
}

export function countByWorkflowTab(items, tabId, userId) {
  return items.filter((item) => matchesWorkflowTab(item, tabId, userId)).length;
}

export const WORKFLOW_STAGE_LABELS = {
  [WORKFLOW_STAGE.READY_FOR_INTAKE]: 'Ready for Intake',
  [WORKFLOW_STAGE.READY_FOR_PROVIDER]: 'Ready for Provider',
  [WORKFLOW_STAGE.READY_FOR_CHECKOUT]: 'Ready for Checkout',
  [WORKFLOW_STAGE.READY_FOR_CODING]: 'Ready for Coding',
};

/** Badge variant keys from `@/components/ui/badge`. */
export const WORKFLOW_STAGE_BADGE_VARIANT = {
  [WORKFLOW_STAGE.READY_FOR_INTAKE]: 'warning',
  [WORKFLOW_STAGE.READY_FOR_PROVIDER]: 'info',
  [WORKFLOW_STAGE.READY_FOR_CHECKOUT]: 'default',
  [WORKFLOW_STAGE.READY_FOR_CODING]: 'success',
};

export function getWorkflowStageLabel(stage) {
  return WORKFLOW_STAGE_LABELS[stage] || '—';
}

export function getWorkflowStageBadgeVariant(stage) {
  return WORKFLOW_STAGE_BADGE_VARIANT[stage] || 'muted';
}
