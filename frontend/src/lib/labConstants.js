/**
 * Laboratory module – shared status colors and constants.
 * Aligns with the clinical 5-tone system (success / info / warning / danger / muted).
 */
import { STATUS_SOFT } from '@/lib/statusColors';

export const LAB_SPECIMEN_STATUS = {
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  COLLECTED: 'Collected',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export const LAB_RECEIVE_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

export const LAB_RESULT_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

/** Soft status badge classes – consistent across all lab pages */
export const LAB_STATUS_BADGE_CLASSES = {
  Pending: STATUS_SOFT.warning,
  Submitted: STATUS_SOFT.warning,
  Collected: STATUS_SOFT.info,
  'In Progress': STATUS_SOFT.info,
  Completed: STATUS_SOFT.success,
  Received: STATUS_SOFT.success,
  Accepted: STATUS_SOFT.success,
  Rejected: STATUS_SOFT.danger,
  Cancelled: STATUS_SOFT.danger,
};

export function getLabStatusBadgeClass(status) {
  if (!status) return STATUS_SOFT.muted;
  return LAB_STATUS_BADGE_CLASSES[status] ?? STATUS_SOFT.muted;
}

export const COLLECTION_SITES = [
  'Left Arm',
  'Right Arm',
  'Left Hand',
  'Right Hand',
  'Finger',
  'Heel',
  'Central Line',
  'Urine',
  'Stool',
  'Sputum',
  'Swab',
  'Other',
];

export const SPECIMEN_TYPES = [
  'Blood',
  'Serum',
  'Plasma',
  'Urine',
  'Stool',
  'Sputum',
  'Swab',
  'Tissue',
  'CSF',
  'Other',
];

export const LAB_TEST_CATEGORIES = [
  'Hematology',
  'Chemistry',
  'Urinalysis',
  'Microbiology',
  'Immunology',
  'Serology',
  'Coagulation',
  'Toxicology',
  'Other',
];

/** Lab Order Transport statuses */
export const LAB_ORDER_TRANSPORT_STATUS = {
  DRAFT: 'Draft',
  SENT_FOR_COLLECTION: 'Sent for collection',
  IN_TRANSPORT: 'In transport',
  RECEIVED_AT_LAB: 'Received at lab',
  CANCELLED: 'Cancelled',
};

export const LAB_ORDER_TRANSPORT_BADGE_CLASSES = {
  Draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Sent for collection': 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
  'In transport': 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
  'Received at lab': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

export function getLabOrderTransportStatusBadgeClass(status) {
  if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  return LAB_ORDER_TRANSPORT_BADGE_CLASSES[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
}

/** Lab Report Received source options */
export const LAB_REPORT_SOURCES = [
  'Patient brought',
  'External lab',
  'Fax',
  'Portal',
];
