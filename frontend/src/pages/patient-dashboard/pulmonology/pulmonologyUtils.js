const STORAGE_PREFIX = 'hms:pulmonology:';
const HISTORY_PREFIX = 'hms:pulmonology-history:';

function storageKey(patientId, appointmentId) {
  return `${STORAGE_PREFIX}${patientId || 'unknown'}::${appointmentId || 'no-appt'}`;
}

function historyKey(patientId) {
  return `${HISTORY_PREFIX}${patientId || 'unknown'}`;
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `pulm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createEmptyInhalerRow() {
  return {
    id: newId(),
    medicationName: '',
    inhalerType: '',
    device: '',
    dose: '',
    frequency: '',
    technique: '',
    adherence: '',
    notes: '',
  };
}

export function createEmptyAsthmaCopdForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    diseaseFocus: '',
    chiefComplaint: '',
    symptomDuration: '',
    symptoms: [],
    triggers: [],
    asthmaClass: '',
    asthmaControl: '',
    actScore: '',
    peakFlowPersonalBest: '',
    peakFlowToday: '',
    daytimeSymptoms: '',
    nightSymptoms: '',
    rescueUsePerWeek: '',
    asthmaExacerbationsLastYear: '',
    goldStage: '',
    goldGroup: '',
    catScore: '',
    mmrc: '',
    cough: '',
    sputum: '',
    copdExacerbationsLastYear: '',
    hospitalizationsLastYear: '',
    primaryDiagnosisCode: '',
    primaryDiagnosisDescription: '',
    primaryDiagnosisDisplay: '',
    clinicalImpression: '',
    managementPlan: '',
    followUpInterval: '',
    providerNotes: '',
  };
}

export function createEmptySpirometryForm() {
  return {
    spirometryDate: '',
    spirometryPerformed: '',
    quality: '',
    fev1Liters: '',
    fev1PercentPredicted: '',
    fvcLiters: '',
    fvcPercentPredicted: '',
    fev1FvcRatio: '',
    postBronchodilatorChange: '',
    interpretation: '',
    peakFlow: '',
    spo2RoomAir: '',
    spo2OnOxygen: '',
    oxygenFlowRate: '',
    oxygenDelivery: '',
    homeOxygenStatus: '',
    homeOxygenLiters: '',
    ambulatoryDesaturation: '',
    abgPerformed: '',
    abgResult: '',
    clinicalNotes: '',
  };
}

export function createEmptyInhalerForm() {
  return {
    inhalers: [],
    overallAdherence: '',
    techniqueObserved: '',
    spacerUsed: '',
    barriers: [],
    educationProvided: [],
    missedDosesLastWeek: '',
    pharmacyRefillConcern: '',
    actionPlanReviewed: '',
    counselingNotes: '',
    followUpPlan: '',
  };
}

export function createEmptySmokingForm() {
  return {
    tobaccoStatus: '',
    packYears: '',
    cigarettesPerDay: '',
    yearsSmoked: '',
    quitDate: '',
    vapingStatus: '',
    vapingDevice: '',
    vapingFrequency: '',
    productsUsed: [],
    secondhandExposure: '',
    quitReadiness: '',
    priorQuitAttempts: '',
    interventions: [],
    cessationReferral: '',
    counselingProvided: '',
    followUpInterval: '',
    clinicalNotes: '',
  };
}

export function createEmptyPulmonologyState(defaults = {}) {
  return {
    asthmaCopd: createEmptyAsthmaCopdForm(defaults),
    spirometry: createEmptySpirometryForm(),
    inhaler: createEmptyInhalerForm(),
    smoking: createEmptySmokingForm(),
    auditLog: [],
    updatedAt: null,
  };
}

export function loadPulmonologyState(patientId, appointmentId, defaults = {}) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    const empty = createEmptyPulmonologyState(defaults);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      asthmaCopd: {
        ...empty.asthmaCopd,
        ...(parsed.asthmaCopd || {}),
        examinationDate:
          parsed.asthmaCopd?.examinationDate ||
          defaults.examinationDate ||
          empty.asthmaCopd.examinationDate,
        provider:
          parsed.asthmaCopd?.provider || defaults.provider || empty.asthmaCopd.provider,
        symptoms: Array.isArray(parsed.asthmaCopd?.symptoms)
          ? parsed.asthmaCopd.symptoms
          : [],
        triggers: Array.isArray(parsed.asthmaCopd?.triggers)
          ? parsed.asthmaCopd.triggers
          : [],
      },
      spirometry: { ...empty.spirometry, ...(parsed.spirometry || {}) },
      inhaler: {
        ...empty.inhaler,
        ...(parsed.inhaler || {}),
        inhalers: Array.isArray(parsed.inhaler?.inhalers) ? parsed.inhaler.inhalers : [],
        barriers: Array.isArray(parsed.inhaler?.barriers) ? parsed.inhaler.barriers : [],
        educationProvided: Array.isArray(parsed.inhaler?.educationProvided)
          ? parsed.inhaler.educationProvided
          : [],
      },
      smoking: {
        ...empty.smoking,
        ...(parsed.smoking || {}),
        productsUsed: Array.isArray(parsed.smoking?.productsUsed)
          ? parsed.smoking.productsUsed
          : [],
        interventions: Array.isArray(parsed.smoking?.interventions)
          ? parsed.smoking.interventions
          : [],
      },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyPulmonologyState(defaults);
  }
}

function buildHistoryEntry(state, appointmentId) {
  return {
    at: new Date().toISOString(),
    appointmentId: appointmentId || null,
    examinationDate: state.asthmaCopd?.examinationDate || '',
    diseaseFocus: state.asthmaCopd?.diseaseFocus || '',
    asthmaControl: state.asthmaCopd?.asthmaControl || '',
    actScore: state.asthmaCopd?.actScore || '',
    goldStage: state.asthmaCopd?.goldStage || '',
    catScore: state.asthmaCopd?.catScore || '',
    fev1PercentPredicted: state.spirometry?.fev1PercentPredicted || '',
    spo2RoomAir: state.spirometry?.spo2RoomAir || '',
    homeOxygenStatus: state.spirometry?.homeOxygenStatus || '',
    overallAdherence: state.inhaler?.overallAdherence || '',
    tobaccoStatus: state.smoking?.tobaccoStatus || '',
    vapingStatus: state.smoking?.vapingStatus || '',
  };
}

export function loadPulmonologyHistory(patientId) {
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
  const prev = loadPulmonologyHistory(patientId);
  const next = [entry, ...prev.filter((e) => e.appointmentId !== entry.appointmentId)].slice(
    0,
    40,
  );
  localStorage.setItem(historyKey(patientId), JSON.stringify(next));
  return next;
}

export function savePulmonologyState(patientId, appointmentId, state) {
  const updatedAt = new Date().toISOString();
  const auditEntry = {
    at: updatedAt,
    note: 'Saved Pulmonology documentation',
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
