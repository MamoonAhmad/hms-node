import { STATUS_SOFT } from '@/lib/statusColors';

export const REFERRAL_STATUSES = [
  'Draft',
  'Pending',
  'Sent',
  'Received',
  'Authorization Pending',
  'Authorized',
  'Scheduled',
  'In Progress',
  'Completed',
  'Report Received',
  'Cancelled',
  'Expired',
  'Denied',
];

export const REFERRAL_PRIORITIES = ['Routine', 'Urgent', 'High Priority', 'Stat'];

export const PRIORITY_BADGE_CLASSES = {
  Routine: STATUS_SOFT.muted,
  Urgent: STATUS_SOFT.warning,
  'High Priority': STATUS_SOFT.warning,
  Stat: STATUS_SOFT.danger,
};

export const STATUS_BADGE_CLASSES = {
  Draft: STATUS_SOFT.muted,
  Pending: STATUS_SOFT.warning,
  Sent: STATUS_SOFT.info,
  Received: STATUS_SOFT.info,
  'Authorization Pending': STATUS_SOFT.warning,
  Authorized: STATUS_SOFT.success,
  Scheduled: STATUS_SOFT.info,
  'In Progress': STATUS_SOFT.info,
  Completed: STATUS_SOFT.success,
  'Report Received': STATUS_SOFT.success,
  Cancelled: STATUS_SOFT.muted,
  Expired: STATUS_SOFT.danger,
  Denied: STATUS_SOFT.danger,
};

export const AUTH_STATUS_OPTIONS = ['Not Required', 'Pending', 'Submitted', 'Approved', 'Denied', 'Expired'];

export const DELIVERY_METHODS = [
  'Internal Routing',
  'Fax',
  'Direct Secure Messaging',
  'Email',
  'Print',
  'Portal Delivery',
];

export const DESTINATION_TYPES = [
  { id: 'internal', label: 'Internal Provider' },
  { id: 'external', label: 'External Provider' },
  { id: 'facility', label: 'Facility' },
];

export const ATTACHMENT_TYPES = [
  'Progress Notes',
  'Consultation Notes',
  'Labs',
  'Imaging Reports',
  'Pathology Reports',
  'Insurance Documents',
  'Medication List',
  'Care Plan',
  'Referral Letter',
  'Other Files',
];

export const NOTE_TYPES = ['General', 'Clinical', 'Administrative', 'Follow-up', 'Authorization'];

export const SPECIALTY_OPTIONS = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Gastroenterology',
  'Pulmonology',
  'Dermatology',
  'Oncology',
  'Endocrinology',
  'Pain Management',
  'Physical Therapy',
  'Occupational Therapy',
  'Speech Therapy',
  'Behavioral Health',
  'Mental Health',
  'Home Health',
  'General Surgery',
  'Other',
];

export const SUMMARY_CARDS = [
  {
    key: 'total',
    label: 'Total Referrals',
    buttonClass: `${STATUS_SOFT.muted} border hover:opacity-90`,
    countClass: 'bg-black/5 text-inherit',
    activeClass: 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background',
  },
  {
    key: 'pending',
    label: 'Pending',
    buttonClass: `${STATUS_SOFT.warning} border hover:opacity-90`,
    countClass: 'bg-black/5 text-inherit',
    activeClass: 'ring-2 ring-[var(--warning)]/40 ring-offset-2 ring-offset-background',
  },
  {
    key: 'scheduled',
    label: 'Scheduled',
    buttonClass: `${STATUS_SOFT.info} border hover:opacity-90`,
    countClass: 'bg-black/5 text-inherit',
    activeClass: 'ring-2 ring-[var(--info)]/40 ring-offset-2 ring-offset-background',
  },
  {
    key: 'authorized',
    label: 'Authorized',
    buttonClass: `${STATUS_SOFT.success} border hover:opacity-90`,
    countClass: 'bg-black/5 text-inherit',
    activeClass: 'ring-2 ring-[var(--success)]/40 ring-offset-2 ring-offset-background',
  },
  {
    key: 'completed',
    label: 'Completed',
    buttonClass: `${STATUS_SOFT.success} border hover:opacity-90`,
    countClass: 'bg-black/5 text-inherit',
    activeClass: 'ring-2 ring-[var(--success)]/40 ring-offset-2 ring-offset-background',
  },
  {
    key: 'expired',
    label: 'Expired',
    buttonClass: `${STATUS_SOFT.danger} border hover:opacity-90`,
    countClass: 'bg-black/5 text-inherit',
    activeClass: 'ring-2 ring-destructive/40 ring-offset-2 ring-offset-background',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    buttonClass: `${STATUS_SOFT.muted} border hover:opacity-90`,
    countClass: 'bg-black/5 text-inherit',
    activeClass: 'ring-2 ring-muted-foreground/30 ring-offset-2 ring-offset-background',
  },
];

/** Match a referral row to a summary filter key (aligned with backend summary counts). */
export function referralMatchesSummaryFilter(referral, filterKey) {
  if (!filterKey || filterKey === 'total') return true;
  const status = referral?.status;
  const now = new Date();
  switch (filterKey) {
    case 'pending':
      return ['Draft', 'Pending', 'Sent', 'Received', 'Authorization Pending'].includes(status);
    case 'scheduled':
      return status === 'Scheduled' || status === 'In Progress';
    case 'authorized':
      return referral?.authorizationStatus === 'Approved' || status === 'Authorized';
    case 'completed':
      return status === 'Completed' || status === 'Report Received';
    case 'cancelled':
      return status === 'Cancelled';
    case 'expired':
      return (
        status === 'Expired' ||
        (referral?.expirationDate &&
          new Date(referral.expirationDate) < now &&
          status !== 'Completed')
      );
    default:
      return true;
  }
}

export const TIMELINE_EVENT_LABELS = {
  'Referral Created': 'Referral Created',
  'Referral Modified': 'Referral Modified',
  'Referral Sent': 'Referral Sent',
  'Authorization Submitted': 'Authorization Submitted',
  'Authorization Approved': 'Authorization Approved',
  'Appointment Scheduled': 'Appointment Scheduled',
  'Appointment Completed': 'Appointment Completed',
  'Consultation Report Received': 'Consultation Report Received',
  'Referral Closed': 'Referral Closed',
};

export const SAMPLE_REFERRALS = [
  {
    id: 'sample-ref-1',
    referralNumber: 'REF-SAMPLE-001',
    referralDate: '2026-07-01',
    referralType: 'Cardiology',
    specialty: 'Cardiology',
    referredToName: 'Dr. Sarah Chen',
    referredToOrganization: 'Heart Care Associates',
    referringProviderName: 'Dr. James Wilson',
    priority: 'Urgent',
    authorizationStatus: 'Approved',
    appointmentScheduledDate: '2026-07-15T10:00:00.000Z',
    status: 'Scheduled',
    expirationDate: '2026-09-01',
    createdByName: 'Dr. James Wilson',
    primaryIcd10Code: 'I10',
    primaryDiagnosis: 'Essential hypertension',
  },
];
