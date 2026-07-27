import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Beaker,
  Boxes,
  CalendarClock,
  ClipboardList,
  Contact,
  CreditCard,
  FileText,
  FlaskConical,
  FolderOpen,
  HeartPulse,
  History,
  Home,
  IdCard,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Microscope,
  Pill,
  Scan,
  Scissors,
  Share2,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Users,
  Waypoints,
} from 'lucide-react';
import { STATUS_SOFT, STATUS_SOLID } from '@/lib/statusColors';

/**
 * Chart navigation sections. `countKey` maps into the counts object produced by
 * the chart context so we can render badges. `roles` (when present) restricts a
 * section to the listed roles; omitted means visible to everyone.
 */
export const CHART_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'Summary' },
  { id: 'encounters', label: 'Encounters', icon: Stethoscope, group: 'Clinical', countKey: 'encounters' },
  { id: 'appointments', label: 'Appointments', icon: CalendarClock, group: 'Clinical', countKey: 'appointments' },
  { id: 'clinical-notes', label: 'Clinical Notes', icon: FileText, group: 'Clinical' },
  { id: 'problems', label: 'Problems', icon: AlertCircle, group: 'Clinical', countKey: 'problems' },
  { id: 'allergies', label: 'Allergies', icon: AlertTriangle, group: 'Clinical', countKey: 'allergies' },
  { id: 'medications', label: 'Medications', icon: Pill, group: 'Clinical' },
  { id: 'orders', label: 'Orders', icon: ClipboardList, group: 'Clinical', countKey: 'orders' },
  { id: 'laboratory', label: 'Laboratory', icon: FlaskConical, group: 'Results' },
  { id: 'imaging', label: 'Imaging', icon: Scan, group: 'Results' },
  { id: 'procedures', label: 'Procedures', icon: Scissors, group: 'Results' },
  { id: 'immunizations', label: 'Immunizations', icon: Syringe, group: 'Results' },
  { id: 'vitals', label: 'Vitals', icon: HeartPulse, group: 'Results' },
  { id: 'assessments', label: 'Assessments', icon: BadgeCheck, group: 'Results' },
  { id: 'flowsheets', label: 'Flowsheets', icon: Activity, group: 'Results' },
  { id: 'documents', label: 'Documents', icon: FolderOpen, group: 'Records', countKey: 'documents' },
  { id: 'communications', label: 'Communications', icon: MessageSquare, group: 'Records' },
  { id: 'referrals', label: 'Referrals', icon: Share2, group: 'Records' },
  { id: 'care-team', label: 'Care Team', icon: Users, group: 'Records' },
  { id: 'demographics', label: 'Demographics', icon: IdCard, group: 'Profile' },
  { id: 'contacts', label: 'Contacts', icon: Contact, group: 'Profile' },
  { id: 'insurance', label: 'Insurance', icon: ShieldCheck, group: 'Profile' },
  { id: 'medical-history', label: 'Medical History', icon: History, group: 'History' },
  { id: 'surgical-history', label: 'Surgical History', icon: Microscope, group: 'History' },
  { id: 'family-history', label: 'Family History', icon: Home, group: 'History' },
  { id: 'social-history', label: 'Social History', icon: Beaker, group: 'History' },
  { id: 'timeline', label: 'Patient Timeline', icon: Waypoints, group: 'History' },
  { id: 'billing', label: 'Billing Summary', icon: CreditCard, group: 'Administrative', roles: ['administrator', 'billing', 'billing staff'] },
  { id: 'audit', label: 'Audit History', icon: Landmark, group: 'Administrative', roles: ['administrator', 'compliance', 'provider'] },
];

export const CHART_SECTION_GROUPS = [
  'Summary',
  'Clinical',
  'Results',
  'Records',
  'Profile',
  'History',
  'Administrative',
];

export const DEFAULT_SECTION = 'overview';

export const VALID_SECTION_IDS = new Set(CHART_SECTIONS.map((s) => s.id));

/**
 * Quick action bar definitions. Each action carries a permission key checked
 * against the current user (see patientChartHelpers.buildPermissions).
 */
export const QUICK_ACTIONS = [
  { id: 'new-encounter', label: 'New Encounter', icon: Stethoscope, perm: 'clinical' },
  { id: 'schedule', label: 'Schedule Appointment', icon: CalendarClock, perm: 'scheduling' },
  { id: 'check-in', label: 'Check In', icon: BadgeCheck, perm: 'scheduling' },
  { id: 'add-note', label: 'Add Clinical Note', icon: FileText, perm: 'clinical' },
  { id: 'place-order', label: 'Place Order', icon: ClipboardList, perm: 'clinical' },
  { id: 'prescribe', label: 'Prescribe', icon: Pill, perm: 'prescribe' },
  { id: 'message', label: 'Send Message', icon: MessageSquare, perm: 'communications' },
  { id: 'upload-document', label: 'Upload Document', icon: FolderOpen, perm: 'documents' },
];

export const MORE_ACTIONS = [
  { id: 'edit-patient', label: 'Edit Patient', icon: IdCard, perm: 'demographics' },
  { id: 'add-insurance', label: 'Add Insurance', icon: ShieldCheck, perm: 'demographics' },
  { id: 'add-allergy', label: 'Add Allergy', icon: AlertTriangle, perm: 'clinical' },
  { id: 'add-problem', label: 'Add Problem', icon: AlertCircle, perm: 'clinical' },
  { id: 'add-contact', label: 'Add Emergency Contact', icon: Contact, perm: 'demographics' },
  { id: 'print-face-sheet', label: 'Print Face Sheet', icon: FileText, perm: 'view' },
  { id: 'audit-history', label: 'View Audit History', icon: Landmark, perm: 'audit' },
];

export const PATIENT_STATUS_STYLES = {
  active: `border ${STATUS_SOFT.success}`,
  inactive: `border ${STATUS_SOFT.muted}`,
  restricted: `border ${STATUS_SOFT.warning}`,
  deceased: STATUS_SOLID.muted,
  dismissed: `border ${STATUS_SOFT.danger}`,
};

export { Boxes };
