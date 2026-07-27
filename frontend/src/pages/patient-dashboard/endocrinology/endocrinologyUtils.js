const STORAGE_PREFIX = 'hms:endocrinology:';
const PATIENT_CARRY_PREFIX = 'hms:endocrinology-carry:';

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

export function createEmptyDiabetesForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    dmType: '',
    diagnosisDate: '',
    durationYears: '',
    glycemicControl: '',
    latestA1c: '',
    a1cDate: '',
    goalA1c: '',
    fastingGlucose: '',
    postPrandialGlucose: '',
    cgmInUse: '',
    cgmDevice: '',
    cgmStartDate: '',
    timeInRange: '',
    timeBelowRange: '',
    timeAboveRange: '',
    gmi: '',
    avgGlucose: '',
    coefficientOfVariation: '',
    hypoEpisodes: '',
    hypoSeverity: '',
    hyperEpisodes: '',
    insulinRegimen: '',
    insulinDetails: '',
    oralAgents: '',
    glp1: '',
    sglt2: '',
    compliance: '',
    complications: [],
    annualCare: [],
    dietEducation: '',
    exercisePlan: '',
    weightGoal: '',
    diabetesNotes: '',
    diabetesPlan: '',
    followUpInterval: '',
  };
}

export function createEmptyThyroidForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    diagnosis: '',
    symptoms: [],
    symptomOnset: '',
    neckExam: [],
    examNotes: '',
    tsh: '',
    tshDate: '',
    freeT4: '',
    freeT3: '',
    tpoAb: '',
    tgab: '',
    trab: '',
    priorLabsNotes: '',
    noduleStatus: '',
    noduleSize: '',
    ultrasoundFindings: '',
    tirads: '',
    fnaResult: '',
    therapy: [],
    levothyroxineDose: '',
    antithyroidDose: '',
    therapyNotes: '',
    thyroidPlan: '',
    followUpInterval: '',
  };
}

export function createEmptyHormoneForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    chiefConcern: '',
    adrenalConcern: '',
    morningCortisol: '',
    acth: '',
    cosyntropinResult: '',
    aldosterone: '',
    plasmaRenin: '',
    metanephrines: '',
    adrenalImaging: '',
    adrenalNotes: '',
    boneStatus: '',
    dexaDate: '',
    dexaSites: [],
    tScoreSpine: '',
    tScoreHip: '',
    fractureHistory: '',
    calciumStatus: '',
    serumCalcium: '',
    ionizedCalcium: '',
    pth: '',
    vitaminD: '',
    phosphate: '',
    boneTherapy: '',
    boneNotes: '',
    prolactin: '',
    igf1: '',
    testosterone: '',
    estradiol: '',
    lhFsh: '',
    otherLabs: '',
    planItems: [],
    endocrinePlan: '',
    followUpInterval: '',
  };
}

export function createEmptyEndocrinologyState(defaults = {}) {
  return {
    diabetes: createEmptyDiabetesForm(defaults),
    thyroid: createEmptyThyroidForm(defaults),
    hormone: createEmptyHormoneForm(defaults),
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
      diabetes: {
        ...state.diabetes,
        dmType: state.diabetes.dmType || carry.dmType || '',
        diagnosisDate: state.diabetes.diagnosisDate || carry.diagnosisDate || '',
        cgmDevice: state.diabetes.cgmDevice || carry.cgmDevice || '',
        cgmInUse: state.diabetes.cgmInUse || carry.cgmInUse || '',
        insulinRegimen: state.diabetes.insulinRegimen || carry.insulinRegimen || '',
        goalA1c: state.diabetes.goalA1c || carry.goalA1c || '',
        oralAgents: state.diabetes.oralAgents || carry.oralAgents || '',
        complications: state.diabetes.complications?.length
          ? state.diabetes.complications
          : carry.complications || [],
      },
      thyroid: {
        ...state.thyroid,
        diagnosis: state.thyroid.diagnosis || carry.thyroidDiagnosis || '',
        therapy: state.thyroid.therapy?.length ? state.thyroid.therapy : carry.thyroidTherapy || [],
        levothyroxineDose: state.thyroid.levothyroxineDose || carry.levothyroxineDose || '',
        noduleStatus: state.thyroid.noduleStatus || carry.noduleStatus || '',
      },
      hormone: {
        ...state.hormone,
        adrenalConcern: state.hormone.adrenalConcern || carry.adrenalConcern || '',
        boneStatus: state.hormone.boneStatus || carry.boneStatus || '',
        boneTherapy: state.hormone.boneTherapy || carry.boneTherapy || '',
      },
    };
  } catch {
    return state;
  }
}

function buildCarryPayload(state) {
  return {
    dmType: state.diabetes?.dmType || '',
    diagnosisDate: state.diabetes?.diagnosisDate || '',
    cgmDevice: state.diabetes?.cgmDevice || '',
    cgmInUse: state.diabetes?.cgmInUse || '',
    insulinRegimen: state.diabetes?.insulinRegimen || '',
    goalA1c: state.diabetes?.goalA1c || '',
    oralAgents: state.diabetes?.oralAgents || '',
    complications: state.diabetes?.complications || [],
    thyroidDiagnosis: state.thyroid?.diagnosis || '',
    thyroidTherapy: state.thyroid?.therapy || [],
    levothyroxineDose: state.thyroid?.levothyroxineDose || '',
    noduleStatus: state.thyroid?.noduleStatus || '',
    adrenalConcern: state.hormone?.adrenalConcern || '',
    boneStatus: state.hormone?.boneStatus || '',
    boneTherapy: state.hormone?.boneTherapy || '',
  };
}

export function loadEndocrinologyState(patientId, appointmentId, defaults = {}) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    if (!raw) {
      const empty = createEmptyEndocrinologyState(defaults);
      return applyCarryForward(patientId, empty);
    }
    const parsed = JSON.parse(raw);
    const base = createEmptyEndocrinologyState(defaults);
    return {
      diabetes: { ...base.diabetes, ...(parsed.diabetes || {}) },
      thyroid: { ...base.thyroid, ...(parsed.thyroid || {}) },
      hormone: { ...base.hormone, ...(parsed.hormone || {}) },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyEndocrinologyState(defaults);
  }
}

export function saveEndocrinologyState(patientId, appointmentId, state, { note } = {}) {
  const updatedAt = new Date().toISOString();
  const auditEntry = {
    at: updatedAt,
    note: note || 'Saved Endocrinology documentation',
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
