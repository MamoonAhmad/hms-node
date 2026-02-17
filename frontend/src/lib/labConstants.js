/**
 * Laboratory module – shared status colors and constants.
 * Use these across Specimen Collection, Transport, Receiver, and Result Management.
 *
 * Pending = Yellow
 * Completed = Green
 * Rejected = Red
 * In Progress = Blue
 * Cancelled = Gray
 */
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

/** Tailwind classes for status badges – consistent across all lab pages */
export const LAB_STATUS_BADGE_CLASSES = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Collected: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Received: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

export function getLabStatusBadgeClass(status) {
  if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  return LAB_STATUS_BADGE_CLASSES[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
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
  'Sent for collection': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'In transport': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
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
