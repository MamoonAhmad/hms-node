import {
  COGNITION_DOMAINS,
  COGNITION_INTERPRETATION,
  FALL_RISK_QUESTIONS,
  MOTOR_REGIONS,
  REFLEX_SITES,
} from './neurologyConstants';

const STORAGE_PREFIX = 'hms:neurology:';
const CARRY_PREFIX = 'hms:neurology-carry:';

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

export function createEmptyMotorMap() {
  return Object.fromEntries(MOTOR_REGIONS.map((region) => [region, '']));
}

export function createEmptyReflexMap() {
  return Object.fromEntries(
    REFLEX_SITES.map((site) => [site, { right: '', left: '' }]),
  );
}

export function createEmptyExamForm() {
  return {
    examDate: todayInputValue(),
    mentalStatus: '',
    mentalStatusNotes: '',
    cranialNerves: [],
    cranialNerveNotes: '',
    motor: createEmptyMotorMap(),
    motorNotes: '',
    sensory: [],
    sensoryNotes: '',
    reflexes: createEmptyReflexMap(),
    plantars: '',
    coordination: [],
    gait: '',
    romberg: '',
    examSummary: '',
  };
}

export function createEmptyDiaryEntry() {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entryType: 'Headache',
    date: todayInputValue(),
    time: '',
    severity: '',
    quality: [],
    location: [],
    duration: '',
    triggers: [],
    seizureType: '',
    seizureDuration: '',
    aura: '',
    postIctal: '',
    witnessed: '',
    medsTaken: '',
    notes: '',
  };
}

export function createEmptyDiaryForm() {
  return {
    baselineFrequency: '',
    currentMedications: '',
    rescuePlan: '',
    entries: [],
  };
}

export function createEmptyFallResponses() {
  return FALL_RISK_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 'no' }), {});
}

export function createEmptyCognitionScores() {
  return COGNITION_DOMAINS.reduce((acc, d) => ({ ...acc, [d.id]: '' }), {});
}

export function createEmptyFallCognitionForm() {
  return {
    assessedAt: todayInputValue(),
    fallResponses: createEmptyFallResponses(),
    fallNotes: '',
    precautions: [],
    cognitionTool: 'Bedside screen (30-point)',
    cognitionScores: createEmptyCognitionScores(),
    cognitionNotes: '',
    caregiverConcerns: '',
    followUpPlan: '',
  };
}

export function createEmptyNeurologyState() {
  return {
    exam: createEmptyExamForm(),
    diary: createEmptyDiaryForm(),
    fallCognition: createEmptyFallCognitionForm(),
    auditLog: [],
    updatedAt: null,
  };
}

export function computeFallRiskScore(responses = {}) {
  return FALL_RISK_QUESTIONS.reduce(
    (sum, q) => (responses[q.id] === 'yes' ? sum + q.yesPoints : sum),
    0,
  );
}

export function interpretFallRisk(score, responses = {}) {
  const hasHighTrigger = FALL_RISK_QUESTIONS.some(
    (q) => q.yesPoints >= 15 && responses[q.id] === 'yes',
  );
  if (hasHighTrigger || score >= 15) {
    return {
      label: 'High fall risk',
      variant: 'danger',
      interpretation: 'Implement high fall-risk precautions; consider yellow ID band.',
    };
  }
  if (score >= 10) {
    return {
      label: 'Moderate fall risk',
      variant: 'warning',
      interpretation: 'Standard fall precautions; reassess with condition changes.',
    };
  }
  return {
    label: 'Low fall risk',
    variant: 'success',
    interpretation: 'Routine care; reassess if mobility or mentation changes.',
  };
}

export function computeCognitionTotal(scores = {}) {
  return COGNITION_DOMAINS.reduce((sum, d) => {
    const raw = scores[d.id];
    const n = Number(raw);
    if (!Number.isFinite(n)) return sum;
    return sum + Math.max(0, Math.min(d.max, n));
  }, 0);
}

export function cognitionMaxTotal() {
  return COGNITION_DOMAINS.reduce((sum, d) => sum + d.max, 0);
}

export function interpretCognition(total) {
  const band =
    COGNITION_INTERPRETATION.find((b) => total >= b.min) ||
    COGNITION_INTERPRETATION[COGNITION_INTERPRETATION.length - 1];
  return {
    label: band.label,
    variant: band.variant,
    interpretation: `Screen total ${total}/${cognitionMaxTotal()}. Correlate clinically; formal testing if indicated.`,
  };
}

function mergeReflexes(defaults, saved) {
  const next = { ...defaults };
  if (!saved || typeof saved !== 'object') return next;
  for (const site of Object.keys(defaults)) {
    next[site] = { ...defaults[site], ...(saved[site] || {}) };
  }
  return next;
}

function applyCarryForward(patientId, state) {
  try {
    const raw = localStorage.getItem(carryKey(patientId));
    if (!raw) return state;
    const carry = JSON.parse(raw);
    return {
      ...state,
      diary: {
        ...state.diary,
        baselineFrequency: state.diary.baselineFrequency || carry.baselineFrequency || '',
        currentMedications: state.diary.currentMedications || carry.currentMedications || '',
        rescuePlan: state.diary.rescuePlan || carry.rescuePlan || '',
        entries: Array.isArray(carry.recentEntries) ? carry.recentEntries : state.diary.entries,
      },
      fallCognition: {
        ...state.fallCognition,
        precautions: state.fallCognition.precautions?.length
          ? state.fallCognition.precautions
          : carry.precautions || [],
        followUpPlan: state.fallCognition.followUpPlan || carry.followUpPlan || '',
      },
    };
  } catch {
    return state;
  }
}

export function loadNeurologyState(patientId, appointmentId) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    if (!raw) {
      return applyCarryForward(patientId, createEmptyNeurologyState());
    }
    const parsed = JSON.parse(raw);
    const defaults = createEmptyNeurologyState();
    return {
      exam: {
        ...defaults.exam,
        ...(parsed.exam || {}),
        motor: { ...defaults.exam.motor, ...(parsed.exam?.motor || {}) },
        reflexes: mergeReflexes(defaults.exam.reflexes, parsed.exam?.reflexes),
      },
      diary: {
        ...defaults.diary,
        ...(parsed.diary || {}),
        entries: Array.isArray(parsed.diary?.entries) ? parsed.diary.entries : [],
      },
      fallCognition: {
        ...defaults.fallCognition,
        ...(parsed.fallCognition || {}),
        fallResponses: {
          ...defaults.fallCognition.fallResponses,
          ...(parsed.fallCognition?.fallResponses || {}),
        },
        cognitionScores: {
          ...defaults.fallCognition.cognitionScores,
          ...(parsed.fallCognition?.cognitionScores || {}),
        },
        precautions: Array.isArray(parsed.fallCognition?.precautions)
          ? parsed.fallCognition.precautions
          : [],
      },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyNeurologyState();
  }
}

function buildCarryPayload(state) {
  const entries = Array.isArray(state.diary?.entries) ? state.diary.entries : [];
  return {
    baselineFrequency: state.diary?.baselineFrequency || '',
    currentMedications: state.diary?.currentMedications || '',
    rescuePlan: state.diary?.rescuePlan || '',
    recentEntries: entries.slice(-10),
    precautions: state.fallCognition?.precautions || [],
    followUpPlan: state.fallCognition?.followUpPlan || '',
  };
}

export function saveNeurologyState(patientId, appointmentId, state, { note } = {}) {
  const updatedAt = new Date().toISOString();
  const auditEntry = {
    at: updatedAt,
    note: note || 'Saved Neurology documentation',
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
