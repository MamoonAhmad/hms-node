import { AUA_SYMPTOM_QUESTIONS } from './urologyConstants';

const STORAGE_PREFIX = 'hms:urology:';
const PATIENT_CARRY_PREFIX = 'hms:urology-carry:';

function storageKey(patientId, appointmentId) {
  return `${STORAGE_PREFIX}${patientId || 'unknown'}::${appointmentId || 'no-appt'}`;
}

function carryKey(patientId) {
  return `${PATIENT_CARRY_PREFIX}${patientId || 'unknown'}`;
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

export function createEmptyLutsAuaForm(defaults = {}) {
  const answers = {};
  for (const q of AUA_SYMPTOM_QUESTIONS) {
    answers[q.id] = '';
  }
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    symptomDuration: '',
    answers,
    qualityOfLife: '',
    priorTherapy: '',
    pvrMl: '',
    uroflowNotes: '',
    planItems: [],
    clinicalNotes: '',
    followUpInterval: '',
  };
}

export function createEmptyHematuriaForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    hematuriaType: '',
    timing: '',
    duration: '',
    rbcPerHpf: '',
    firstEpisode: '',
    associatedSymptoms: [],
    riskFactors: [],
    anticoagulated: '',
    recentUtI: '',
    smokingStatus: '',
    packYears: '',
    occupationExposure: '',
    workupOrdered: [],
    imagingFindings: '',
    cystoscopyFindings: '',
    planItems: [],
    clinicalNotes: '',
    followUpInterval: '',
  };
}

export function createEmptyStoneVoidingForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    stoneHistory: '',
    priorStoneCount: '',
    side: '',
    location: '',
    stoneSizeMm: '',
    painSeverity: '',
    onsetDate: '',
    nauseaVomiting: '',
    fever: '',
    voidingSymptoms: [],
    hematuriaWithEpisode: '',
    imagingModality: '',
    imagingDate: '',
    imagingFindings: '',
    hydronephrosis: '',
    creatinine: '',
    uaFindings: '',
    management: [],
    dietCounseling: [],
    metabolicWorkup: '',
    clinicalNotes: '',
    followUpInterval: '',
  };
}

export function createEmptyUrologyState(defaults = {}) {
  return {
    lutsAua: createEmptyLutsAuaForm(defaults),
    hematuria: createEmptyHematuriaForm(defaults),
    stoneVoiding: createEmptyStoneVoidingForm(defaults),
    auditLog: [],
    updatedAt: null,
  };
}

/** Compute AUA / IPSS total (0–35) from answer map. Returns null if incomplete. */
export function computeAuaScore(answers = {}) {
  let total = 0;
  let answered = 0;
  for (const q of AUA_SYMPTOM_QUESTIONS) {
    const raw = answers[q.id];
    if (raw === '' || raw == null) continue;
    const n = Number(raw);
    if (Number.isNaN(n) || n < 0 || n > 5) continue;
    total += n;
    answered += 1;
  }
  if (answered === 0) return null;
  if (answered < AUA_SYMPTOM_QUESTIONS.length) {
    return { total, answered, complete: false };
  }
  return { total, answered, complete: true };
}

export function auaSeverityLabel(total) {
  if (total == null || Number.isNaN(total)) return null;
  if (total <= 7) return { label: 'Mild', tone: 'success' };
  if (total <= 19) return { label: 'Moderate', tone: 'warning' };
  return { label: 'Severe', tone: 'danger' };
}

function applyCarryForward(patientId, state) {
  try {
    const raw = localStorage.getItem(carryKey(patientId));
    if (!raw) return state;
    const carry = JSON.parse(raw);
    return {
      ...state,
      lutsAua: {
        ...state.lutsAua,
        priorTherapy: state.lutsAua.priorTherapy || carry.priorTherapy || '',
        planItems: state.lutsAua.planItems?.length
          ? state.lutsAua.planItems
          : carry.lutsPlanItems || [],
      },
      hematuria: {
        ...state.hematuria,
        smokingStatus: state.hematuria.smokingStatus || carry.smokingStatus || '',
        packYears: state.hematuria.packYears || carry.packYears || '',
        riskFactors: state.hematuria.riskFactors?.length
          ? state.hematuria.riskFactors
          : carry.hematuriaRiskFactors || [],
      },
      stoneVoiding: {
        ...state.stoneVoiding,
        stoneHistory: state.stoneVoiding.stoneHistory || carry.stoneHistory || '',
        priorStoneCount: state.stoneVoiding.priorStoneCount || carry.priorStoneCount || '',
        dietCounseling: state.stoneVoiding.dietCounseling?.length
          ? state.stoneVoiding.dietCounseling
          : carry.dietCounseling || [],
      },
    };
  } catch {
    return state;
  }
}

function buildCarryPayload(state) {
  return {
    priorTherapy: state.lutsAua?.priorTherapy || '',
    lutsPlanItems: state.lutsAua?.planItems || [],
    smokingStatus: state.hematuria?.smokingStatus || '',
    packYears: state.hematuria?.packYears || '',
    hematuriaRiskFactors: state.hematuria?.riskFactors || [],
    stoneHistory: state.stoneVoiding?.stoneHistory || '',
    priorStoneCount: state.stoneVoiding?.priorStoneCount || '',
    dietCounseling: state.stoneVoiding?.dietCounseling || [],
  };
}

export function loadUrologyState(patientId, appointmentId, defaults = {}) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    if (!raw) {
      const empty = createEmptyUrologyState(defaults);
      return applyCarryForward(patientId, empty);
    }
    const parsed = JSON.parse(raw);
    const base = createEmptyUrologyState(defaults);
    return {
      lutsAua: {
        ...base.lutsAua,
        ...(parsed.lutsAua || {}),
        answers: { ...base.lutsAua.answers, ...(parsed.lutsAua?.answers || {}) },
      },
      hematuria: { ...base.hematuria, ...(parsed.hematuria || {}) },
      stoneVoiding: { ...base.stoneVoiding, ...(parsed.stoneVoiding || {}) },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyUrologyState(defaults);
  }
}

export function saveUrologyState(patientId, appointmentId, state, { note } = {}) {
  const updatedAt = new Date().toISOString();
  const auditEntry = {
    at: updatedAt,
    note: note || 'Saved Urology documentation',
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
