const STORAGE_PREFIX = 'hms:oncology-hematology:';
const HISTORY_PREFIX = 'hms:oncology-hematology-history:';
const CARRY_PREFIX = 'hms:oncology-hematology-carry:';

function storageKey(patientId, appointmentId) {
  return `${STORAGE_PREFIX}${patientId || 'unknown'}::${appointmentId || 'no-appt'}`;
}

function historyKey(patientId) {
  return `${HISTORY_PREFIX}${patientId || 'unknown'}`;
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

export function createEmptyStagingForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    diseaseCategory: '',
    primarySite: '',
    histology: '',
    diagnosisDate: '',
    tStage: '',
    nStage: '',
    mStage: '',
    stageGroup: '',
    stagingSystem: '',
    treatmentIntent: '',
    modalities: [],
    regimenName: '',
    protocolNotes: '',
    cycleNumber: '',
    dayOfCycle: '',
    cyclePhase: '',
    totalPlannedCycles: '',
    lastTreatmentDate: '',
    nextTreatmentDate: '',
    ecog: '',
    weightKg: '',
    bsa: '',
    primaryDiagnosisCode: '',
    primaryDiagnosisDescription: '',
    primaryDiagnosisDisplay: '',
    clinicalNotes: '',
  };
}

export function createEmptyNeutropeniaForm() {
  return {
    screenDate: todayInputValue(),
    feverPresent: '',
    temperatureC: '',
    feverSource: '',
    feverOnset: '',
    lastChemoDate: '',
    ancValue: '',
    ancDate: '',
    ancRisk: '',
    wbc: '',
    absoluteNeutrophilCountNote: '',
    symptoms: [],
    centralLinePresent: '',
    recentHospitalization: '',
    fnRisk: '',
    bloodCulturesDrawn: '',
    antibioticsStarted: '',
    antibioticDetails: '',
    gcsfGiven: '',
    disposition: '',
    returnPrecautionsReviewed: '',
    clinicalNotes: '',
  };
}

export function createEmptySupportiveForm() {
  return {
    supportiveMeasures: [],
    antiemeticRegimen: '',
    growthFactorPlan: '',
    painScore: '',
    painPlan: '',
    nutritionConcerns: '',
    hydrationPlan: '',
    transfusionPlan: '',
    otherSupportiveNotes: '',
    advanceDirectiveStatus: '',
    codeStatus: '',
    goalsOfCare: '',
    healthcareProxy: '',
    palliativeDiscussed: '',
    hospiceDiscussed: '',
    advanceCareNotes: '',
    followUpInterval: '',
    patientEducation: '',
  };
}

export function createEmptyOncologyState(defaults = {}) {
  return {
    staging: createEmptyStagingForm(defaults),
    neutropenia: createEmptyNeutropeniaForm(),
    supportive: createEmptySupportiveForm(),
    auditLog: [],
    updatedAt: null,
  };
}

function loadCarryForward(patientId) {
  try {
    const raw = localStorage.getItem(carryKey(patientId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCarryForward(patientId, state) {
  const payload = {
    staging: {
      diseaseCategory: state.staging?.diseaseCategory || '',
      primarySite: state.staging?.primarySite || '',
      histology: state.staging?.histology || '',
      diagnosisDate: state.staging?.diagnosisDate || '',
      tStage: state.staging?.tStage || '',
      nStage: state.staging?.nStage || '',
      mStage: state.staging?.mStage || '',
      stageGroup: state.staging?.stageGroup || '',
      stagingSystem: state.staging?.stagingSystem || '',
      treatmentIntent: state.staging?.treatmentIntent || '',
      modalities: Array.isArray(state.staging?.modalities) ? state.staging.modalities : [],
      regimenName: state.staging?.regimenName || '',
      protocolNotes: state.staging?.protocolNotes || '',
      cycleNumber: state.staging?.cycleNumber || '',
      totalPlannedCycles: state.staging?.totalPlannedCycles || '',
      nextTreatmentDate: state.staging?.nextTreatmentDate || '',
      primaryDiagnosisCode: state.staging?.primaryDiagnosisCode || '',
      primaryDiagnosisDescription: state.staging?.primaryDiagnosisDescription || '',
      primaryDiagnosisDisplay: state.staging?.primaryDiagnosisDisplay || '',
    },
    supportive: {
      advanceDirectiveStatus: state.supportive?.advanceDirectiveStatus || '',
      codeStatus: state.supportive?.codeStatus || '',
      goalsOfCare: state.supportive?.goalsOfCare || '',
      healthcareProxy: state.supportive?.healthcareProxy || '',
      antiemeticRegimen: state.supportive?.antiemeticRegimen || '',
      growthFactorPlan: state.supportive?.growthFactorPlan || '',
    },
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(carryKey(patientId), JSON.stringify(payload));
}

export function loadOncologyState(patientId, appointmentId, defaults = {}) {
  try {
    const empty = createEmptyOncologyState(defaults);
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return mergeState(empty, parsed, defaults);
    }

    const carry = loadCarryForward(patientId);
    if (!carry) return empty;

    return {
      ...empty,
      staging: {
        ...empty.staging,
        ...(carry.staging || {}),
        examinationDate: defaults.examinationDate || empty.staging.examinationDate,
        provider: defaults.provider || empty.staging.provider,
        modalities: Array.isArray(carry.staging?.modalities) ? carry.staging.modalities : [],
      },
      supportive: {
        ...empty.supportive,
        ...(carry.supportive || {}),
        supportiveMeasures: [],
      },
      updatedAt: null,
    };
  } catch {
    return createEmptyOncologyState(defaults);
  }
}

function mergeState(empty, parsed, defaults) {
  return {
    staging: {
      ...empty.staging,
      ...(parsed.staging || {}),
      examinationDate:
        parsed.staging?.examinationDate ||
        defaults.examinationDate ||
        empty.staging.examinationDate,
      provider: parsed.staging?.provider || defaults.provider || empty.staging.provider,
      modalities: Array.isArray(parsed.staging?.modalities) ? parsed.staging.modalities : [],
    },
    neutropenia: {
      ...empty.neutropenia,
      ...(parsed.neutropenia || {}),
      symptoms: Array.isArray(parsed.neutropenia?.symptoms) ? parsed.neutropenia.symptoms : [],
    },
    supportive: {
      ...empty.supportive,
      ...(parsed.supportive || {}),
      supportiveMeasures: Array.isArray(parsed.supportive?.supportiveMeasures)
        ? parsed.supportive.supportiveMeasures
        : [],
    },
    auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
    updatedAt: parsed.updatedAt || null,
  };
}

function buildHistoryEntry(state, appointmentId) {
  return {
    at: new Date().toISOString(),
    appointmentId: appointmentId || null,
    examinationDate: state.staging?.examinationDate || '',
    primarySite: state.staging?.primarySite || '',
    stageGroup: state.staging?.stageGroup || '',
    regimenName: state.staging?.regimenName || '',
    cycleNumber: state.staging?.cycleNumber || '',
    dayOfCycle: state.staging?.dayOfCycle || '',
    feverPresent: state.neutropenia?.feverPresent || '',
    ancRisk: state.neutropenia?.ancRisk || '',
    disposition: state.neutropenia?.disposition || '',
    codeStatus: state.supportive?.codeStatus || '',
    goalsOfCare: state.supportive?.goalsOfCare || '',
  };
}

export function loadOncologyHistory(patientId) {
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
  const prev = loadOncologyHistory(patientId);
  const next = [entry, ...prev.filter((e) => e.appointmentId !== entry.appointmentId)].slice(
    0,
    40,
  );
  localStorage.setItem(historyKey(patientId), JSON.stringify(next));
  return next;
}

export function saveOncologyState(patientId, appointmentId, state) {
  const updatedAt = new Date().toISOString();
  const auditEntry = {
    at: updatedAt,
    note: 'Saved Oncology / Hematology documentation',
    appointmentId: appointmentId || null,
  };
  const payload = {
    ...state,
    updatedAt,
    auditLog: [...(Array.isArray(state.auditLog) ? state.auditLog : []), auditEntry].slice(-50),
  };
  localStorage.setItem(storageKey(patientId, appointmentId), JSON.stringify(payload));
  saveCarryForward(patientId, payload);
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

/** Derive ANC risk band from numeric ANC when clinician has not set one. */
export function suggestAncRisk(ancValue) {
  const n = Number(ancValue);
  if (!Number.isFinite(n) || ancValue === '' || ancValue == null) return '';
  if (n >= 1500) return 'ANC ≥1500 (Normal)';
  if (n >= 1000) return 'ANC 1000–1499 (Mild)';
  if (n >= 500) return 'ANC 500–999 (Moderate)';
  return 'ANC <500 (Severe)';
}
