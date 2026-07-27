const STORAGE_PREFIX = 'hms:ophthalmology:';
const HISTORY_PREFIX = 'hms:ophthalmology-history:';

function storageKey(patientId, appointmentId) {
  return `${STORAGE_PREFIX}${patientId || 'unknown'}::${appointmentId || 'no-appt'}`;
}

function historyKey(patientId) {
  return `${HISTORY_PREFIX}${patientId || 'unknown'}`;
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `oph-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createEmptyOcularMedication() {
  return {
    id: newId(),
    medicationName: '',
    eye: '',
    dose: '',
    frequency: '',
    startDate: '',
    compliance: '',
    sideEffects: '',
  };
}

export function createEmptyEyeDropAdmin() {
  return {
    id: newId(),
    medication: '',
    eye: '',
    dose: '',
    time: '',
    administeredBy: '',
  };
}

export function createEmptyVisionForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    odUncorrected: '',
    osUncorrected: '',
    ouUncorrected: '',
    odCorrected: '',
    osCorrected: '',
    ouCorrected: '',
    odNear: '',
    osNear: '',
    ouNear: '',
    odPinhole: '',
    osPinhole: '',
    usesGlasses: '',
    usesContactLenses: '',
    lensType: '',
    contactLensType: '',
    wearingCorrectionToday: '',
    manifestRefractionOd: '',
    manifestRefractionOs: '',
    finalPrescriptionOd: '',
    finalPrescriptionOs: '',
    addPower: '',
    pupillaryDistance: '',
    colourVisionTested: '',
    colourVisionResult: '',
    confrontationTest: '',
    automatedVisualFieldOrdered: '',
    visualFieldResult: '',
    providerNotes: '',
  };
}

export function createEmptyExamForm() {
  return {
    externalExam: [],
    externalNotes: '',
    eyelids: [],
    conjunctiva: [],
    cornea: [],
    anteriorChamber: [],
    iris: [],
    lens: [],
    perrla: '',
    pupilsEqual: '',
    pupilsReactive: '',
    rapdPresent: '',
    pupilSizeOd: '',
    pupilSizeOs: '',
    eom: [],
    opticDisc: [],
    cupToDiscOd: '',
    cupToDiscOs: '',
    retina: [],
    macula: [],
    retinalVessels: [],
    peripheralRetina: [],
    neurological: [],
    assessmentNotes: '',
  };
}

export function createEmptyPlanForm() {
  return {
    tonometryMethod: '',
    iopOd: '',
    iopOs: '',
    timeMeasured: '',
    glaucomaSuspected: '',
    glaucomaDiagnosis: '',
    glaucomaStage: '',
    targetIop: '',
    visualFieldProgression: '',
    octPerformed: '',
    ocularMedications: [],
    eyeDropsToday: [],
    procedures: [],
    diagnosticOrders: [],
    referrals: [],
    followUpInterval: '',
    repeatIop: '',
    repeatOct: '',
    repeatVisualField: '',
    nextDilatedExam: '',
    patientEducation: [],
    primaryDiagnosisCode: '',
    primaryDiagnosisDescription: '',
    primaryDiagnosisDisplay: '',
    secondaryDiagnosisCode: '',
    secondaryDiagnosisDescription: '',
    secondaryDiagnosisDisplay: '',
    clinicalImpression: '',
    treatmentPlan: '',
    surgicalRecommendation: '',
    surgeryType: '',
    returnPrecautions: '',
    encounterSummary: '',
  };
}

export function createEmptyOphthalmologyState(defaults = {}) {
  return {
    vision: createEmptyVisionForm(defaults),
    exam: createEmptyExamForm(),
    plan: createEmptyPlanForm(),
    auditLog: [],
    updatedAt: null,
  };
}

export function loadOphthalmologyState(patientId, appointmentId, defaults = {}) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    const empty = createEmptyOphthalmologyState(defaults);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      vision: {
        ...empty.vision,
        ...(parsed.vision || {}),
        examinationDate: parsed.vision?.examinationDate || defaults.examinationDate || empty.vision.examinationDate,
        provider: parsed.vision?.provider || defaults.provider || empty.vision.provider,
      },
      exam: { ...empty.exam, ...(parsed.exam || {}) },
      plan: {
        ...empty.plan,
        ...(parsed.plan || {}),
        ocularMedications: Array.isArray(parsed.plan?.ocularMedications)
          ? parsed.plan.ocularMedications
          : [],
        eyeDropsToday: Array.isArray(parsed.plan?.eyeDropsToday)
          ? parsed.plan.eyeDropsToday
          : [],
      },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyOphthalmologyState(defaults);
  }
}

function buildHistoryEntry(state, appointmentId) {
  return {
    at: new Date().toISOString(),
    appointmentId: appointmentId || null,
    examinationDate: state.vision?.examinationDate || '',
    odCorrected: state.vision?.odCorrected || '',
    osCorrected: state.vision?.osCorrected || '',
    ouCorrected: state.vision?.ouCorrected || '',
    iopOd: state.plan?.iopOd || '',
    iopOs: state.plan?.iopOs || '',
    cupToDiscOd: state.exam?.cupToDiscOd || '',
    cupToDiscOs: state.exam?.cupToDiscOs || '',
    retina: state.exam?.retina || [],
  };
}

export function loadOphthalmologyHistory(patientId) {
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
  const prev = loadOphthalmologyHistory(patientId);
  const next = [entry, ...prev.filter((e) => e.appointmentId !== entry.appointmentId)].slice(0, 40);
  localStorage.setItem(historyKey(patientId), JSON.stringify(next));
  return next;
}

export function saveOphthalmologyState(patientId, appointmentId, state) {
  const updatedAt = new Date().toISOString();
  const auditEntry = {
    at: updatedAt,
    note: 'Saved Ophthalmology documentation',
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
