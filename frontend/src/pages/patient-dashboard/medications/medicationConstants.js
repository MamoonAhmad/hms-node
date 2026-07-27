import { STATUS_SOFT } from '@/lib/statusColors';

export const MEDICATION_STATUS_TABS = [
  { id: 'All', label: 'All' },
  { id: 'Draft', label: 'Draft' },
  { id: 'Signed', label: 'Signed' },
  { id: 'Verified', label: 'Verified' },
  { id: 'Sent', label: 'Sent' },
  { id: 'Completed', label: 'Completed' },
  { id: 'Cancelled', label: 'Cancelled' },
];

export const HANDLING_METHODS = [
  {
    id: 'give_in_clinic',
    label: 'Give in Clinic',
    description: 'In-office medication administration routed to eMAR',
  },
  {
    id: 'sample_given',
    label: 'Sample Given',
    description: 'Manufacturer sample dispensed in clinic and routed to eMAR',
  },
  {
    id: 'send_to_pharmacy',
    label: 'Send to Pharmacy',
    description: 'Electronic prescription transmitted to pharmacy using the e-prescribing network',
  },
  {
    id: 'print',
    label: 'Print',
    description: 'Paper prescription given to patient to take to pharmacy',
  },
];

export const SIG_UNITS = ['mg', 'mcg', 'g', 'mL', 'units', 'tablet', 'capsule'];

export const SIG_ROUTES = [
  'By Mouth (PO)',
  'Sublingual (SL)',
  'Topical',
  'Intravenous (IV)',
  'Intramuscular (IM)',
  'Subcutaneous (SC)',
  'Inhalation',
];

export const SIG_FREQUENCIES = [
  'Once daily (QD)',
  'Twice daily (BID)',
  'Three times daily (TID)',
  'Four times daily (QID)',
  'Every 6 hours (Q6H)',
  'Every 8 hours (Q8H)',
  'At bedtime (QHS)',
  'As needed (PRN)',
];

export const SIG_DURATIONS = [
  '7 days',
  '10 days',
  '14 days',
  '30 days',
  '60 days',
  '90 days',
  'Ongoing',
];

export const SIG_TEMPLATES = [
  { id: 'qd-30', label: 'Once daily × 30 days', dose: '1', unit: 'tablet', route: 'By Mouth (PO)', frequency: 'Once daily (QD)', duration: '30 days' },
  { id: 'bid-14', label: 'Twice daily × 14 days', dose: '1', unit: 'tablet', route: 'By Mouth (PO)', frequency: 'Twice daily (BID)', duration: '14 days' },
  { id: 'qhs-30', label: 'At bedtime × 30 days', dose: '1', unit: 'tablet', route: 'By Mouth (PO)', frequency: 'At bedtime (QHS)', duration: '30 days' },
];

export const PHARMACY_OPTIONS = [
  'City Pharmacy',
  'HealthPlus Pharmacy',
  'Onsite Pharmacy',
];

export const CUSTOM_ORDER_SETS_STORAGE_KEY = 'hms-custom-order-sets';

export const STATUS_BADGE_CLASSES = {
  Draft: STATUS_SOFT.muted,
  Signed: STATUS_SOFT.info,
  Verified: STATUS_SOFT.success,
  Sent: STATUS_SOFT.info,
  Completed: STATUS_SOFT.success,
  Cancelled: STATUS_SOFT.danger,
};

export const HANDLING_LABELS = Object.fromEntries(
  HANDLING_METHODS.map((m) => [m.id, m.label]),
);

export const SAMPLE_MEDICATION_CATALOG = [
  { id: 'sample-1', name: 'Lisinopril 10 mg tablet', code: 'MED-LISINOPRIL-10MG', strength: '10 mg', dosageForm: 'Tablet', medicationClass: 'ACE Inhibitor', formularyTier: 'Tier 1', ndcSafetyFlag: 'Verified' },
  { id: 'sample-2', name: 'Amlodipine 5 mg tablet', code: 'MED-AMLODIPINE-5MG', strength: '5 mg', dosageForm: 'Tablet', medicationClass: 'Calcium Channel Blocker', formularyTier: 'Tier 1', ndcSafetyFlag: 'Verified' },
  { id: 'sample-3', name: 'Atorvastatin 20 mg tablet', code: 'MED-ATORVASTATIN-20MG', strength: '20 mg', dosageForm: 'Tablet', medicationClass: 'Statin', formularyTier: 'Tier 1', ndcSafetyFlag: 'Verified' },
  { id: 'sample-4', name: 'Metoprolol succinate 50 mg ER tablet', code: 'MED-METOPROLOL-SUCCINATE-50MG', strength: '50 mg', dosageForm: 'Extended-Release Tablet', medicationClass: 'Beta Blocker', formularyTier: 'Tier 2', ndcSafetyFlag: 'Verified' },
  { id: 'sample-5', name: 'Toprol-XL 25mg Extended-Release Tablet', code: 'MED-TOPROL-XL-25MG', strength: '25 mg', dosageForm: 'Extended-Release Tablet', medicationClass: 'Beta Blocker', formularyTier: 'Tier 2', ndcSafetyFlag: 'Verified' },
  { id: 'sample-6', name: 'Losartan 50 mg tablet', code: 'MED-LOSARTAN-50MG', strength: '50 mg', dosageForm: 'Tablet', medicationClass: 'ARB', formularyTier: 'Tier 1', ndcSafetyFlag: 'Verified' },
  { id: 'sample-7', name: 'Hydrochlorothiazide 25 mg tablet', code: 'MED-HCTZ-25MG', strength: '25 mg', dosageForm: 'Tablet', medicationClass: 'Thiazide Diuretic', formularyTier: 'Tier 1', ndcSafetyFlag: 'Verified' },
  { id: 'sample-8', name: 'Carvedilol 12.5 mg tablet', code: 'MED-CARVEDILO-12-5MG', strength: '12.5 mg', dosageForm: 'Tablet', medicationClass: 'Beta Blocker', formularyTier: 'Tier 2', ndcSafetyFlag: 'Verified' },
];

export const SAMPLE_MEDICATION_ORDERS = [
  {
    id: 'sample-mo-1',
    medicationName: 'Metformin 500 mg tablet',
    medicationCode: 'MED-METFORMIN-500MG',
    medicationClass: 'Biguanide',
    strength: '500 mg',
    dosageForm: 'Tablet',
    handlingMethod: 'send_to_pharmacy',
    status: 'Signed',
    dose: '500',
    unit: 'mg',
    route: 'By Mouth (PO)',
    frequency: 'Twice daily (BID)',
    duration: '30 days',
    prn: false,
    sigPreview: 'Take 500 mg by mouth twice daily for 30 days',
    pharmacy: 'City Pharmacy',
    quantity: 60,
    refills: 2,
    daysSupply: 30,
    prescriber: 'Dr. Ali',
    orderedBy: 'Dr. Ali',
    safetyAcknowledged: true,
    createdAt: new Date().toISOString(),
  },
];
