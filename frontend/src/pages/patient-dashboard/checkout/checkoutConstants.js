import { STATUS_SOFT } from '@/lib/statusColors';

export const CHECKOUT_STATUSES = {
  not_started: { label: 'Not Started', className: `border ${STATUS_SOFT.muted}` },
  in_progress: { label: 'In Progress', className: `border ${STATUS_SOFT.info}` },
  pending_clinical_sign_off: { label: 'Pending Clinical Sign-Off', className: `border ${STATUS_SOFT.warning}` },
  pending_payment: { label: 'Pending Payment', className: `border ${STATUS_SOFT.warning}` },
  pending_follow_up: { label: 'Pending Follow-Up', className: `border ${STATUS_SOFT.warning}` },
  completed: { label: 'Completed', className: `border ${STATUS_SOFT.success}` },
  cancelled: { label: 'Cancelled', className: `border ${STATUS_SOFT.danger}` },
};

export const CHECKLIST_ITEMS = [
  { key: 'provider_note_signed', label: 'Provider note signed' },
  { key: 'diagnosis_added', label: 'Diagnosis added' },
  { key: 'orders_reviewed', label: 'Orders reviewed' },
  { key: 'labs_imaging_reviewed', label: 'Labs/imaging orders reviewed' },
  { key: 'medications_reviewed', label: 'Medications reviewed' },
  { key: 'referrals_reviewed', label: 'Referrals reviewed' },
  { key: 'follow_up_scheduled', label: 'Follow-up appointment scheduled' },
  { key: 'patient_instructions_provided', label: 'Patient instructions provided' },
  { key: 'documents_printed_or_shared', label: 'Documents printed or shared' },
  { key: 'copay_payment_collected', label: 'Copay/payment collected' },
  { key: 'billing_codes_reviewed', label: 'Billing codes reviewed' },
  { key: 'insurance_verified', label: 'Insurance verified' },
  { key: 'checkout_completed', label: 'Checkout completed' },
];

export const CHECKLIST_STATE_STYLES = {
  completed: STATUS_SOFT.success,
  pending: STATUS_SOFT.muted,
  not_required: STATUS_SOFT.muted,
  needs_attention: STATUS_SOFT.warning,
};

export const CHECKLIST_STATE_LABELS = {
  completed: 'Completed',
  pending: 'Pending',
  not_required: 'Not Required',
  needs_attention: 'Needs Attention',
};

export const INSTRUCTION_TYPES = [
  'Visit Summary',
  'Medication Instructions',
  'Lab Instructions',
  'Imaging Instructions',
  'Referral Instructions',
  'Diet Instructions',
  'Activity Instructions',
  'Follow-Up Instructions',
  'Warning Signs / Return Precautions',
  'Other Instructions',
];

export const NOTE_TYPES = [
  { value: 'patient_concern', label: 'Patient concern' },
  { value: 'payment_note', label: 'Payment note' },
  { value: 'follow_up_note', label: 'Follow-up note' },
  { value: 'scheduling_note', label: 'Scheduling note' },
  { value: 'referral_note', label: 'Referral note' },
  { value: 'general', label: 'General checkout note' },
];

export const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Check',
  'Online Payment',
  'Insurance',
  'Waived',
  'Other',
];

export const TASK_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

export const INSURANCE_STATUSES = ['Verified', 'Pending', 'Not Verified', 'Inactive', 'Self-Pay'];

export const FOLLOW_UP_TIMEFRAMES = [
  '1 week',
  '2 weeks',
  '1 month',
  '3 months',
  '6 months',
  '1 year',
  'As needed',
  'Custom',
];

export const DOCUMENT_TYPES = [
  'After Visit Summary',
  'Visit Note',
  'Lab Orders',
  'Imaging Orders',
  'Referral Letter',
  'Medication Prescription',
  'School/Work Note',
  'Consent Forms',
  'Payment Receipt',
];

export const ORDER_STATUS_STYLES = {
  Draft: 'bg-muted text-muted-foreground',
  Signed: 'bg-blue-50 text-blue-800',
  Sent: 'bg-indigo-50 text-indigo-800',
  Completed: 'bg-green-50 text-green-800',
  Cancelled: 'bg-red-50 text-red-800',
  Pending: 'bg-amber-50 text-amber-900',
  Scheduled: 'bg-slate-50 text-slate-700',
};

export function buildSampleCheckoutBundle(patient, appointment, encounter) {
  const apptDate = encounter?.appointmentDate || new Date().toISOString().slice(0, 10);
  return {
    checkout: {
      id: 'sample-checkout',
      status: 'in_progress',
      followUpRequired: true,
      followUpTimeframe: '2 weeks',
      followUpReason: 'Return for blood pressure recheck',
      followUpData: { appointmentDate: '', appointmentTime: '', reason: 'BP follow-up' },
      billingData: { codesReviewed: false, cptCodes: ['99213'], icd10Codes: ['I10'] },
      insuranceStatus: 'Verified',
      documentsMeta: { printedOrShared: false },
      instructions: [
        {
          id: 'si1',
          instructionType: 'Warning Signs / Return Precautions',
          content: 'Seek urgent care for chest pain, shortness of breath, or BP > 180/110.',
        },
      ],
      notes: [],
      tasks: [],
      payments: [],
      isLocked: false,
    },
    status: 'in_progress',
    checklist: CHECKLIST_ITEMS.map((item, i) => ({
      key: item.key,
      state: i < 5 ? 'completed' : i < 8 ? 'pending' : 'not_required',
    })),
    header: {
      patient: {
        name: patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Sample Patient',
        mrn: patient?.mrn || 'MRN-0001',
        dateOfBirth: patient?.dateOfBirth,
        age: 45,
        gender: patient?.gender || 'Female',
        phone: patient?.cellPhone || '(555) 555-0100',
        email: patient?.email || 'patient@example.com',
        photoUrl: null,
      },
      encounter: {
        encounterNumber: appointment?.encounterNumber || 'ENC-2026-001',
        visitDate: apptDate,
        visitType: encounter?.type || 'Office Visit',
        appointmentTime: encounter?.appointmentTime || '10:30 AM',
        provider: encounter?.visitProvider || 'Dr. Sample Provider',
        department: appointment?.department || 'Internal Medicine',
        location: encounter?.location || 'Main Clinic',
        room: 'Exam 3',
        visitStatus: appointment?.status || 'In Progress',
      },
    },
    clinicalReview: {
      chiefComplaint: encounter?.reason || 'Hypertension follow-up',
      diagnoses: [{ code: 'I10', description: 'Essential hypertension', status: 'Active' }],
      assessment: 'Blood pressure improved on current regimen.',
      plan: 'Continue lisinopril. Recheck in 2 weeks.',
      signedSoapNote: true,
      ordersCount: 2,
      medicationsCount: 1,
      proceduresCount: 0,
      referralsCount: 0,
      patientInstructions: [],
      followUpPlan: 'Return in 2 weeks for BP check',
      warnings: [],
    },
    orders: [
      { id: 'o1', orderType: 'Laboratory', procedureName: 'Basic Metabolic Panel', procedureCode: '80048', status: 'Signed', orderedBy: 'Dr. Sample', orderDateTime: new Date().toISOString() },
      { id: 'o2', orderType: 'Imaging', procedureName: 'Chest X-Ray', procedureCode: '71046', status: 'Sent', orderedBy: 'Dr. Sample', orderDateTime: new Date().toISOString() },
    ],
    medications: [
      { id: 'm1', medicationName: 'Lisinopril', dose: '10 mg', route: 'PO', frequency: 'Daily', duration: '90 days', handlingMethod: 'Send to Pharmacy', pharmacy: 'Main Pharmacy', status: 'Signed', instructions: 'Take in the morning' },
    ],
    referrals: [],
    billing: {
      insuranceStatus: 'Verified',
      primaryInsurance: { provider: 'Blue Cross', memberId: 'BC123456', copay: 25 },
      secondaryInsurance: null,
      copayAmount: 25,
      balanceDue: 25,
      charges: [],
      cptCodes: ['99213'],
      icd10Codes: ['I10'],
      billingProvider: 'Dr. Sample Provider',
      paymentStatus: 'Due',
    },
    insurance: { status: 'Verified', eligibility: null, insurances: [] },
    validation: { canComplete: false, blockers: [{ key: 'patient_instructions_provided', message: 'Add patient instructions before completing checkout.' }] },
  };
}
