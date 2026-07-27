import { PRENATAL_LAB_PANEL } from './womensHealthConstants';

const STORAGE_PREFIX = 'hms:womens-health:';

function storageKey(patientId, appointmentId) {
  return `${STORAGE_PREFIX}${patientId || 'unknown'}::${appointmentId || 'no-appt'}`;
}

export function createEmptyObstetricForm() {
  return {
    pregnancyStatus: '',
    gravida: '',
    para: '',
    termBirths: '',
    pretermBirths: '',
    abortions: '',
    livingChildren: '',
    multiplePregnancy: false,
    highRiskPregnancy: false,
    pregnancyRiskFactors: [],
    lmp: '',
    edd: '',
    gestationalAge: '',
    datingMethod: '',
    pregnancyTrimester: '',
    firstPrenatalVisit: '',
    plannedPregnancy: '',
    pregnancyConfirmedBy: '',
    bloodPressure: '',
    pulse: '',
    temperature: '',
    respiratoryRate: '',
    weight: '',
    bmi: '',
    weightGainSincePregnancy: '',
    urineProtein: '',
    urineGlucose: '',
    fht: '',
    fetalMovement: '',
    fundalHeight: '',
    fetalPresentation: '',
    numberOfFetuses: '',
    contractions: '',
    vaginalBleeding: '',
    leakageOfFluid: '',
    oedema: '',
    pregnancySymptoms: [],
    pregnancyComplications: [],
    prenatalVitamins: false,
    aspirin: false,
    iron: false,
    calcium: false,
    folicAcid: false,
    otherPregnancyMedications: '',
    pregnancyProgress: '',
    highRiskAssessment: '',
    providerImpression: '',
    assessmentNotes: '',
    continuePrenatalCare: false,
    followUpInterval: '',
    ultrasoundOrdered: false,
    prenatalLabsOrdered: false,
    referral: '',
    deliveryPlanningNotes: '',
    patientEducation: '',
  };
}

export function createEmptyGynForm() {
  return {
    visitType: '',
    lmp: '',
    cycleLength: '',
    regularCycles: '',
    duration: '',
    flow: '',
    dysmenorrhea: '',
    menopauseStatus: '',
    sexuallyActive: '',
    contraception: '',
    numberOfPartners: '',
    stiHistory: '',
    dyspareunia: '',
    breastExam: [],
    breastNotes: '',
    externalGenitalia: [],
    vaginalExam: [],
    cervix: [],
    uterus: [],
    adnexa: [],
    rectovaginalExam: '',
    rectovaginalNotes: '',
    papCollected: '',
    papCollectionDate: '',
    sampleAdequate: '',
    cytologyResult: '',
    bethesdaClassification: '',
    papFollowUpRequired: '',
    hpvTestOrdered: '',
    hpvCollected: '',
    hpvResult: '',
    highRiskHpv: '',
    hpvGenotype: '',
    hpvFollowUp: '',
    stiTesting: [],
    pelvicFindings: '',
    clinicalImpression: '',
    diagnoses: '',
    planActions: [],
    planNotes: '',
  };
}

export function createDefaultLabRows() {
  return PRENATAL_LAB_PANEL.map((lab) => ({
    ...lab,
    orderedDate: '',
    collectedDate: '',
    resultDate: '',
    result: '',
    normalRange: '',
    status: '',
    provider: '',
    notes: '',
  }));
}

export function createEmptyWomensHealthState() {
  return {
    obstetric: createEmptyObstetricForm(),
    gyn: createEmptyGynForm(),
    labs: createDefaultLabRows(),
    updatedAt: null,
  };
}

export function loadWomensHealthState(patientId, appointmentId) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    if (!raw) return createEmptyWomensHealthState();
    const parsed = JSON.parse(raw);
    const defaults = createEmptyWomensHealthState();
    return {
      obstetric: { ...defaults.obstetric, ...(parsed.obstetric || {}) },
      gyn: { ...defaults.gyn, ...(parsed.gyn || {}) },
      labs: mergeLabRows(defaults.labs, parsed.labs),
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyWomensHealthState();
  }
}

function mergeLabRows(defaults, saved) {
  if (!Array.isArray(saved) || !saved.length) return defaults;
  const byId = new Map(saved.map((row) => [row.id, row]));
  return defaults.map((row) => ({ ...row, ...(byId.get(row.id) || {}) }));
}

export function saveWomensHealthState(patientId, appointmentId, state) {
  const payload = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(storageKey(patientId, appointmentId), JSON.stringify(payload));
  return payload;
}

/** Parse YYYY-MM-DD as local date. */
function parseLocalDate(value) {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function formatDateInput(date) {
  if (!date || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Naegele’s rule: EDD = LMP + 280 days. */
export function estimateEddFromLmp(lmp) {
  const date = parseLocalDate(lmp);
  if (!date) return '';
  const edd = new Date(date);
  edd.setDate(edd.getDate() + 280);
  return formatDateInput(edd);
}

/** Gestational age as "Xw Yd" from LMP to reference date (default today). */
export function calculateGestationalAge(lmp, referenceDate = new Date()) {
  const start = parseLocalDate(lmp);
  if (!start) return '';
  const ref = referenceDate instanceof Date ? referenceDate : parseLocalDate(referenceDate) || new Date();
  const diffMs = startOfDay(ref).getTime() - startOfDay(start).getTime();
  if (diffMs < 0) return '';
  const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return `${weeks}w ${days}d`;
}

export function calculateTrimester(lmp, referenceDate = new Date()) {
  const ga = calculateGestationalAge(lmp, referenceDate);
  if (!ga) return '';
  const weeks = Number(ga.split('w')[0]);
  if (!Number.isFinite(weeks)) return '';
  if (weeks < 14) return 'First';
  if (weeks < 28) return 'Second';
  return 'Third';
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Pull latest vitals payload from intake bundle sections. */
export function extractVitalsFromIntakeBundle(bundle) {
  const records = bundle?.data?.records || bundle?.records || bundle?.data || [];
  const list = Array.isArray(records) ? records : [];
  const vitalsRecords = list
    .filter((r) => String(r.sectionType || r.section || '').toLowerCase().includes('vital'))
    .sort((a, b) => new Date(b.recordedAt || b.createdAt || 0) - new Date(a.recordedAt || a.createdAt || 0));

  const payload = vitalsRecords[0]?.payload || vitalsRecords[0]?.data || null;
  if (!payload || typeof payload !== 'object') return null;

  const systolic = payload.systolic ?? payload.systolicBp ?? payload.sbp;
  const diastolic = payload.diastolic ?? payload.diastolicBp ?? payload.dbp;
  const bp =
    payload.bloodPressure ||
    payload.bp ||
    (systolic && diastolic ? `${systolic}/${diastolic}` : '');

  return {
    bloodPressure: bp || '',
    pulse: payload.pulse != null ? String(payload.pulse) : '',
    temperature: payload.temperature != null ? String(payload.temperature) : payload.temp != null ? String(payload.temp) : '',
    respiratoryRate:
      payload.respiratoryRate != null
        ? String(payload.respiratoryRate)
        : payload.rr != null
          ? String(payload.rr)
          : '',
    weight: payload.weight != null ? String(payload.weight) : '',
    bmi: payload.bmi != null ? String(payload.bmi) : '',
  };
}

export function toggleListValue(list, value) {
  const current = Array.isArray(list) ? list : [];
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}
