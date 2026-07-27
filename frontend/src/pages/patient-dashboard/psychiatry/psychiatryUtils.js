import { SI_HI_QUESTIONS } from './psychiatryConstants';

const STORAGE_PREFIX = 'hms:psychiatry:';
const HISTORY_PREFIX = 'hms:psychiatry-history:';

function storageKey(patientId, appointmentId) {
  return `${STORAGE_PREFIX}${patientId || 'unknown'}::${appointmentId || 'no-appt'}`;
}

function historyKey(patientId) {
  return `${HISTORY_PREFIX}${patientId || 'unknown'}`;
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `psych-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createEmptySiHiResponses() {
  return SI_HI_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: '' }), {});
}

export function isSiHiQuestionVisible(question, responses = {}) {
  if (!question.dependsOn) return true;
  return responses[question.dependsOn] === 'Yes';
}

export function createEmptyMedicationRow() {
  return {
    id: newId(),
    medicationName: '',
    medicationClass: '',
    dose: '',
    frequency: '',
    indication: '',
    adherence: '',
    sideEffects: [],
    notes: '',
  };
}

export function createEmptySafetyForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    responses: createEmptySiHiResponses(),
    accessToMeans: '',
    meansDetails: '',
    firearmsInHome: '',
    riskFactors: [],
    protectiveFactors: [],
    precautions: [],
    disposition: '',
    safetyPlanSummary: '',
    collateralContacted: '',
    collateralNotes: '',
    clinicalImpression: '',
    providerNotes: '',
  };
}

export function createEmptyPsychopharmForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    primaryDiagnosis: '',
    medications: [],
    overallAdherence: '',
    sideEffectBurden: '',
    medChangesThisVisit: '',
    monitoringLabsDue: '',
    therapyModality: [],
    therapyStatus: '',
    therapistName: '',
    therapistContact: '',
    therapyFrequency: '',
    lastTherapySession: '',
    coordinationActions: [],
    socialSupports: '',
    barriersToCare: '',
    sharedGoals: '',
    followUpInterval: '',
    carePlanNotes: '',
    providerNotes: '',
  };
}

export function createEmptyPsychiatryState(defaults = {}) {
  return {
    safety: createEmptySafetyForm(defaults),
    psychopharm: createEmptyPsychopharmForm(defaults),
    auditLog: [],
    updatedAt: null,
  };
}

/** C-SSRS-style risk banding using SI-HI item responses. */
export function interpretSafetyRisk(responses = {}) {
  const yes = (id) => responses[id] === 'Yes';
  const recentBehavior = yes('siBehavior') && yes('siBehaviorRecent');
  const highHi = yes('hiPlan') || (yes('hiThoughts') && yes('hiAccessMeans') && yes('hiTarget'));

  if (yes('siIntent') || yes('siPlan') || recentBehavior || highHi) {
    return {
      label: 'High risk',
      variant: 'danger',
      interpretation:
        'Immediate notification of physician and/or behavioral health; initiate patient safety precautions.',
    };
  }
  if (yes('siMethod') || (yes('hiThoughts') && yes('hiTarget'))) {
    return {
      label: 'Moderate risk',
      variant: 'warning',
      interpretation:
        'Behavioral health evaluation; do not leave patient unattended pending assessment.',
    };
  }
  if (yes('siActiveThoughts') || yes('siBehavior') || yes('hiThoughts')) {
    return {
      label: 'Low–moderate risk',
      variant: 'warning',
      interpretation: 'Behavioral health referral and safety planning indicated.',
    };
  }
  if (yes('siWishDead')) {
    return {
      label: 'Low risk',
      variant: 'info',
      interpretation: 'Passive ideation reported; document, monitor, and reinforce supports.',
    };
  }
  return {
    label: 'No acute SI-HI risk',
    variant: 'success',
    interpretation: 'No suicidal or homicidal ideation / behavior reported on this screen.',
  };
}

export function countPositiveSiHi(responses = {}) {
  return SI_HI_QUESTIONS.filter(
    (q) => isSiHiQuestionVisible(q, responses) && responses[q.id] === 'Yes',
  ).length;
}

export function loadPsychiatryState(patientId, appointmentId, defaults = {}) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    const empty = createEmptyPsychiatryState(defaults);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      safety: {
        ...empty.safety,
        ...(parsed.safety || {}),
        examinationDate:
          parsed.safety?.examinationDate ||
          defaults.examinationDate ||
          empty.safety.examinationDate,
        provider: parsed.safety?.provider || defaults.provider || empty.safety.provider,
        responses: {
          ...empty.safety.responses,
          ...(parsed.safety?.responses || {}),
        },
        riskFactors: Array.isArray(parsed.safety?.riskFactors)
          ? parsed.safety.riskFactors
          : [],
        protectiveFactors: Array.isArray(parsed.safety?.protectiveFactors)
          ? parsed.safety.protectiveFactors
          : [],
        precautions: Array.isArray(parsed.safety?.precautions)
          ? parsed.safety.precautions
          : [],
      },
      psychopharm: {
        ...empty.psychopharm,
        ...(parsed.psychopharm || {}),
        examinationDate:
          parsed.psychopharm?.examinationDate ||
          defaults.examinationDate ||
          empty.psychopharm.examinationDate,
        provider:
          parsed.psychopharm?.provider || defaults.provider || empty.psychopharm.provider,
        medications: Array.isArray(parsed.psychopharm?.medications)
          ? parsed.psychopharm.medications
          : [],
        therapyModality: Array.isArray(parsed.psychopharm?.therapyModality)
          ? parsed.psychopharm.therapyModality
          : [],
        coordinationActions: Array.isArray(parsed.psychopharm?.coordinationActions)
          ? parsed.psychopharm.coordinationActions
          : [],
      },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyPsychiatryState(defaults);
  }
}

function buildHistoryEntry(state, appointmentId) {
  const risk = interpretSafetyRisk(state.safety?.responses || {});
  return {
    at: new Date().toISOString(),
    appointmentId: appointmentId || null,
    examinationDate: state.safety?.examinationDate || '',
    riskLabel: risk.label,
    positiveSiHi: countPositiveSiHi(state.safety?.responses || {}),
    disposition: state.safety?.disposition || '',
    medCount: Array.isArray(state.psychopharm?.medications)
      ? state.psychopharm.medications.length
      : 0,
    therapyStatus: state.psychopharm?.therapyStatus || '',
    overallAdherence: state.psychopharm?.overallAdherence || '',
  };
}

export function loadPsychiatryHistory(patientId) {
  try {
    const raw = localStorage.getItem(historyKey(patientId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendHistory(patientId, entry) {
  const prev = loadPsychiatryHistory(patientId);
  const next = [entry, ...prev.filter((e) => e.appointmentId !== entry.appointmentId)].slice(
    0,
    40,
  );
  localStorage.setItem(historyKey(patientId), JSON.stringify(next));
  return next;
}

export function savePsychiatryState(patientId, appointmentId, state) {
  const updatedAt = new Date().toISOString();
  const auditEntry = {
    at: updatedAt,
    note: 'Saved Psychiatry / Behavioral Health documentation',
    appointmentId: appointmentId || null,
  };
  const payload = {
    ...state,
    updatedAt,
    auditLog: [...(Array.isArray(state.auditLog) ? state.auditLog : []), auditEntry].slice(-50),
  };
  localStorage.setItem(storageKey(patientId, appointmentId), JSON.stringify(payload));
  appendHistory(patientId, buildHistoryEntry(payload, appointmentId));
  return payload;
}

export function toggleListValue(list, value) {
  const current = Array.isArray(list) ? list : [];
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
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
