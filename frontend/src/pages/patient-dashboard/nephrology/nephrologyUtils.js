import { NEPHROTOXIC_MED_CATEGORIES } from './nephrologyConstants';

const STORAGE_PREFIX = 'hms:nephrology:';
const CARRY_PREFIX = 'hms:nephrology-carry:';

function storageKey(patientId, appointmentId) {
  return `${STORAGE_PREFIX}${patientId || 'unknown'}::${appointmentId || 'no-appt'}`;
}

function carryKey(patientId) {
  return `${CARRY_PREFIX}${patientId || 'unknown'}`;
}

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function providerDisplayName(appointment) {
  if (!appointment) return '';
  const p = appointment.provider || appointment.Provider;
  if (!p) {
    return (
      appointment.providerName ||
      appointment.providerFullName ||
      [appointment.providerFirstName, appointment.providerLastName].filter(Boolean).join(' ') ||
      ''
    );
  }
  if (typeof p === 'string') return p;
  return (
    p.fullName ||
    [p.firstName, p.lastName].filter(Boolean).join(' ') ||
    p.name ||
    ''
  );
}

export function createEmptyCkdTrackerForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    ckdStage: '',
    ckdCause: '',
    creatinine: '',
    egfr: '',
    egfrMethod: '',
    egfrDate: defaults.examinationDate || todayInputValue(),
    priorEgfr: '',
    egfrTrend: '',
    proteinuriaMethod: '',
    acr: '',
    pcr: '',
    urineProtein24h: '',
    aStage: '',
    proteinuriaTrend: '',
    hematuria: '',
    bpSystolic: '',
    bpDiastolic: '',
    potassium: '',
    bicarbonate: '',
    hemoglobin: '',
    clinicalNotes: '',
    planNotes: '',
    followUpInterval: '',
  };
}

export function createEmptyVolumeStatusForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    volumeStatus: '',
    edema: '',
    weightKg: '',
    dryWeightKg: '',
    weightChange: '',
    orthostasis: '',
    jvpElevated: '',
    lungFindings: '',
    bpControl: '',
    targetBp: '',
    dialysisModality: '',
    dialysisAccess: '',
    dialysisSchedule: '',
    lastDialysisDate: '',
    ufGoal: '',
    transplantStatus: '',
    transplantCenter: '',
    transplantDate: '',
    immunosuppression: '',
    volumePlan: '',
    clinicalNotes: '',
    followUpInterval: '',
  };
}

export function createEmptyNephrotoxicMedRow() {
  return {
    id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    categoryId: '',
    medicationName: '',
    dose: '',
    frequency: '',
    indication: '',
    currentlyTaking: 'Yes',
    action: '',
    notes: '',
  };
}

export function createEmptyNephrotoxicReviewForm(defaults = {}) {
  const checklist = Object.fromEntries(
    NEPHROTOXIC_MED_CATEGORIES.map((c) => [c.id, 'no']),
  );
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    reviewedWithPatient: '',
    pharmacyReconciled: '',
    checklist,
    medications: [],
    contrastRecent: '',
    contrastDate: '',
    contrastType: '',
    akiRiskDiscussed: '',
    planItems: [],
    clinicalNotes: '',
    followUpInterval: '',
  };
}

export function createEmptyNephrologyState(defaults = {}) {
  return {
    ckdTracker: createEmptyCkdTrackerForm(defaults),
    volumeStatus: createEmptyVolumeStatusForm(defaults),
    nephrotoxicReview: createEmptyNephrotoxicReviewForm(defaults),
    auditLog: [],
    updatedAt: null,
  };
}

function applyCarryForward(patientId, state) {
  try {
    const raw = localStorage.getItem(carryKey(patientId));
    if (!raw) return state;
    const carry = JSON.parse(raw);
    return {
      ...state,
      ckdTracker: {
        ...state.ckdTracker,
        ckdStage: state.ckdTracker.ckdStage || carry.ckdStage || '',
        ckdCause: state.ckdTracker.ckdCause || carry.ckdCause || '',
        priorEgfr: state.ckdTracker.priorEgfr || carry.lastEgfr || '',
        aStage: state.ckdTracker.aStage || carry.aStage || '',
      },
      volumeStatus: {
        ...state.volumeStatus,
        dialysisModality: state.volumeStatus.dialysisModality || carry.dialysisModality || '',
        dialysisAccess: state.volumeStatus.dialysisAccess || carry.dialysisAccess || '',
        dryWeightKg: state.volumeStatus.dryWeightKg || carry.dryWeightKg || '',
        transplantStatus: state.volumeStatus.transplantStatus || carry.transplantStatus || '',
        immunosuppression:
          state.volumeStatus.immunosuppression || carry.immunosuppression || '',
      },
      nephrotoxicReview: {
        ...state.nephrotoxicReview,
        medications: state.nephrotoxicReview.medications?.length
          ? state.nephrotoxicReview.medications
          : Array.isArray(carry.medications)
            ? carry.medications
            : [],
        planItems: state.nephrotoxicReview.planItems?.length
          ? state.nephrotoxicReview.planItems
          : carry.planItems || [],
      },
    };
  } catch {
    return state;
  }
}

function buildCarryPayload(state) {
  return {
    ckdStage: state.ckdTracker?.ckdStage || '',
    ckdCause: state.ckdTracker?.ckdCause || '',
    lastEgfr: state.ckdTracker?.egfr || '',
    aStage: state.ckdTracker?.aStage || '',
    dialysisModality: state.volumeStatus?.dialysisModality || '',
    dialysisAccess: state.volumeStatus?.dialysisAccess || '',
    dryWeightKg: state.volumeStatus?.dryWeightKg || '',
    transplantStatus: state.volumeStatus?.transplantStatus || '',
    immunosuppression: state.volumeStatus?.immunosuppression || '',
    medications: Array.isArray(state.nephrotoxicReview?.medications)
      ? state.nephrotoxicReview.medications.slice(0, 20)
      : [],
    planItems: state.nephrotoxicReview?.planItems || [],
  };
}

export function loadNephrologyState(patientId, appointmentId, defaults = {}) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    if (!raw) {
      return applyCarryForward(patientId, createEmptyNephrologyState(defaults));
    }
    const parsed = JSON.parse(raw);
    const base = createEmptyNephrologyState(defaults);
    return {
      ckdTracker: { ...base.ckdTracker, ...(parsed.ckdTracker || {}) },
      volumeStatus: { ...base.volumeStatus, ...(parsed.volumeStatus || {}) },
      nephrotoxicReview: {
        ...base.nephrotoxicReview,
        ...(parsed.nephrotoxicReview || {}),
        checklist: {
          ...base.nephrotoxicReview.checklist,
          ...(parsed.nephrotoxicReview?.checklist || {}),
        },
        medications: Array.isArray(parsed.nephrotoxicReview?.medications)
          ? parsed.nephrotoxicReview.medications
          : [],
        planItems: Array.isArray(parsed.nephrotoxicReview?.planItems)
          ? parsed.nephrotoxicReview.planItems
          : [],
      },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyNephrologyState(defaults);
  }
}

export function saveNephrologyState(patientId, appointmentId, state, { note } = {}) {
  const updatedAt = new Date().toISOString();
  const auditEntry = {
    at: updatedAt,
    note: note || 'Saved Nephrology documentation',
    appointmentId: appointmentId || null,
  };
  const payload = {
    ...state,
    updatedAt,
    auditLog: [...(Array.isArray(state.auditLog) ? state.auditLog : []), auditEntry].slice(-50),
  };
  localStorage.setItem(storageKey(patientId, appointmentId), JSON.stringify(payload));
  localStorage.setItem(carryKey(patientId), JSON.stringify(buildCarryPayload(payload)));
  return payload;
}

export function toggleListValue(list, value) {
  const current = Array.isArray(list) ? list : [];
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}
