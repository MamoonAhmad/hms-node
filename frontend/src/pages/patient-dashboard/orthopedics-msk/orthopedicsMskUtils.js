import { ALL_SPECIAL_TESTS, ROM_MOVEMENTS, STRENGTH_GROUPS } from './orthopedicsMskConstants';

const STORAGE_PREFIX = 'hms:orthopedics-msk:';
const PATIENT_CARRY_PREFIX = 'hms:orthopedics-msk-carry:';

function storageKey(patientId, appointmentId) {
  return `${STORAGE_PREFIX}${patientId || 'unknown'}::${appointmentId || 'no-appt'}`;
}

function carryKey(patientId) {
  return `${PATIENT_CARRY_PREFIX}${patientId || 'unknown'}`;
}

function emptyRomRows() {
  return Object.fromEntries(
    ROM_MOVEMENTS.map((movement) => [
      movement,
      { active: '', passive: '', pain: '', normal: '' },
    ]),
  );
}

function emptyStrengthRows() {
  return Object.fromEntries(STRENGTH_GROUPS.map((group) => [group, '']));
}

function emptySpecialTests() {
  return Object.fromEntries(ALL_SPECIAL_TESTS.map((name) => [name, 'Not Performed']));
}

export function createEmptyInjuryForm() {
  return {
    injuryType: '',
    dateOfInjury: '',
    timeOfInjury: '',
    injurySide: '',
    bodyRegion: [],
    specificBodyPart: [],
    injuryStatus: '',
    visitType: '',
    mechanismOfInjury: '',
    detailedDescription: '',
    injuryWitnessed: '',
    directBlow: '',
    twistingInjury: '',
    hyperextension: '',
    hyperflexion: '',
    repetitiveMotion: '',
    contactInjury: '',
    nonContactInjury: '',
    injuryLocations: [],
    symptoms: [],
    painScore: '',
    painLocation: '',
    painQuality: [],
    painDuration: '',
    painPattern: '',
    aggravatingFactors: [],
    relievingFactors: [],
    initialTreatment: [],
    painPulledFromIntake: false,
  };
}

export function createEmptyExamForm() {
  return {
    inspection: '',
    inspectionNotes: '',
    palpation: [],
    rom: emptyRomRows(),
    strength: emptyStrengthRows(),
    jointStability: [],
    neurological: [],
    vascular: [],
    gait: '',
    specialTests: emptySpecialTests(),
    examNotes: '',
  };
}

export function createEmptyPlanForm() {
  return {
    imagingRequired: '',
    imagingType: [],
    imagingBodyPart: '',
    imagingLaterality: '',
    imagingPriority: '',
    clinicalIndication: '',
    orderedDate: '',
    imagingStatus: '',
    resultSummary: '',
    devicePrescribed: '',
    deviceBodyPart: '',
    deviceLaterality: '',
    wearSchedule: '',
    deviceDuration: '',
    fittedToday: '',
    patientEducationProvided: '',
    ptReferral: '',
    therapyFrequency: '',
    therapyDuration: '',
    homeExerciseProgramme: '',
    activityRestrictions: [],
    weightBearingStatus: '',
    returnToWorkDate: '',
    returnToSportsDate: '',
    followUpInterval: '',
    patientEducation: '',
    treatmentPlan: [],
  };
}

export function createEmptyOrthoMskState() {
  return {
    injury: createEmptyInjuryForm(),
    exam: createEmptyExamForm(),
    plan: createEmptyPlanForm(),
    auditLog: [],
    updatedAt: null,
  };
}

function mergeRom(defaults, saved) {
  const next = { ...defaults };
  if (!saved || typeof saved !== 'object') return next;
  for (const key of Object.keys(defaults)) {
    next[key] = { ...defaults[key], ...(saved[key] || {}) };
  }
  return next;
}

function mergeSpecialTests(defaults, saved) {
  return { ...defaults, ...(saved && typeof saved === 'object' ? saved : {}) };
}

export function loadOrthoMskState(patientId, appointmentId) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    if (!raw) {
      const empty = createEmptyOrthoMskState();
      return applyCarryForward(patientId, empty);
    }
    const parsed = JSON.parse(raw);
    const defaults = createEmptyOrthoMskState();
    return {
      injury: { ...defaults.injury, ...(parsed.injury || {}) },
      exam: {
        ...defaults.exam,
        ...(parsed.exam || {}),
        rom: mergeRom(defaults.exam.rom, parsed.exam?.rom),
        strength: { ...defaults.exam.strength, ...(parsed.exam?.strength || {}) },
        specialTests: mergeSpecialTests(defaults.exam.specialTests, parsed.exam?.specialTests),
      },
      plan: { ...defaults.plan, ...(parsed.plan || {}) },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyOrthoMskState();
  }
}

/** Carry forward injury + rehab fields from the patient's last saved encounter. */
function applyCarryForward(patientId, state) {
  try {
    const raw = localStorage.getItem(carryKey(patientId));
    if (!raw) return state;
    const carry = JSON.parse(raw);
    const visitType = state.injury.visitType || 'Follow-up';
    const isFollowUp = visitType !== 'New Injury';

    return {
      ...state,
      injury: {
        ...state.injury,
        visitType: state.injury.visitType || (carry.dateOfInjury ? 'Follow-up' : ''),
        dateOfInjury: isFollowUp || !state.injury.dateOfInjury
          ? carry.dateOfInjury || state.injury.dateOfInjury
          : state.injury.dateOfInjury,
        injuryType: state.injury.injuryType || carry.injuryType || '',
        bodyRegion: state.injury.bodyRegion?.length ? state.injury.bodyRegion : carry.bodyRegion || [],
        specificBodyPart: state.injury.specificBodyPart?.length
          ? state.injury.specificBodyPart
          : carry.specificBodyPart || [],
        injurySide: state.injury.injurySide || carry.injurySide || '',
        mechanismOfInjury: state.injury.mechanismOfInjury || carry.mechanismOfInjury || '',
        detailedDescription: state.injury.detailedDescription || carry.detailedDescription || '',
        injuryLocations: state.injury.injuryLocations?.length
          ? state.injury.injuryLocations
          : carry.injuryLocations || [],
      },
      plan: {
        ...state.plan,
        activityRestrictions: state.plan.activityRestrictions?.length
          ? state.plan.activityRestrictions
          : carry.activityRestrictions || [],
        weightBearingStatus: state.plan.weightBearingStatus || carry.weightBearingStatus || '',
        homeExerciseProgramme: state.plan.homeExerciseProgramme || carry.homeExerciseProgramme || '',
        therapyFrequency: state.plan.therapyFrequency || carry.therapyFrequency || '',
        therapyDuration: state.plan.therapyDuration || carry.therapyDuration || '',
        patientEducation: state.plan.patientEducation || carry.patientEducation || '',
      },
    };
  } catch {
    return state;
  }
}

function buildCarryPayload(state) {
  return {
    dateOfInjury: state.injury?.dateOfInjury || '',
    injuryType: state.injury?.injuryType || '',
    bodyRegion: state.injury?.bodyRegion || [],
    specificBodyPart: state.injury?.specificBodyPart || [],
    injurySide: state.injury?.injurySide || '',
    mechanismOfInjury: state.injury?.mechanismOfInjury || '',
    detailedDescription: state.injury?.detailedDescription || '',
    injuryLocations: state.injury?.injuryLocations || [],
    activityRestrictions: state.plan?.activityRestrictions || [],
    weightBearingStatus: state.plan?.weightBearingStatus || '',
    homeExerciseProgramme: state.plan?.homeExerciseProgramme || '',
    therapyFrequency: state.plan?.therapyFrequency || '',
    therapyDuration: state.plan?.therapyDuration || '',
    patientEducation: state.plan?.patientEducation || '',
  };
}

export function saveOrthoMskState(patientId, appointmentId, state, { note } = {}) {
  const updatedAt = new Date().toISOString();
  const auditEntry = {
    at: updatedAt,
    note: note || 'Saved Orthopedics / MSK documentation',
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

export function extractPainFromIntakeBundle(bundle) {
  const records = bundle?.data?.records || bundle?.records || bundle?.data || [];
  const list = Array.isArray(records) ? records : [];
  const vitalsRecords = list
    .filter((r) => String(r.sectionType || r.section || '').toLowerCase().includes('vital'))
    .sort(
      (a, b) =>
        new Date(b.recordedAt || b.createdAt || 0) - new Date(a.recordedAt || a.createdAt || 0),
    );

  const payload = vitalsRecords[0]?.payload || vitalsRecords[0]?.data || null;
  if (!payload || typeof payload !== 'object') return null;

  const assessed = String(payload.painAssessed || '').toLowerCase();
  if (assessed === 'no' || assessed === 'n') return { painScore: '' };

  const score = payload.painLevel ?? payload.painScore ?? payload.pain;
  if (score == null || score === '') return null;
  return { painScore: String(score) };
}

export function toggleListValue(list, value) {
  const current = Array.isArray(list) ? list : [];
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}
