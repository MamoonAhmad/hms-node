import { ALARM_INVESTIGATION_RECOMMENDATIONS } from './gastroenterologyConstants';

const STORAGE_PREFIX = 'hms:gastroenterology:';
const PATIENT_CARRY_PREFIX = 'hms:gastroenterology-carry:';
const HISTORY_PREFIX = 'hms:gastroenterology-history:';

function storageKey(patientId, appointmentId) {
  return `${STORAGE_PREFIX}${patientId || 'unknown'}::${appointmentId || 'no-appt'}`;
}

function carryKey(patientId) {
  return `${PATIENT_CARRY_PREFIX}${patientId || 'unknown'}`;
}

function historyKey(patientId) {
  return `${HISTORY_PREFIX}${patientId || 'unknown'}`;
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `gi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function providerDisplayName(appointment) {
  if (!appointment) return '';
  const p = appointment.providerRef || appointment.provider || appointment.Provider;
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
    [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') ||
    p.name ||
    ''
  );
}

export function toggleListValue(list, value) {
  const current = Array.isArray(list) ? list : [];
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}

export function createEmptySymptomsForm() {
  return {
    visitType: '',
    chiefGiComplaint: '',
    symptomDuration: '',
    symptomOnset: '',
    affectedRegion: '',
    symptoms: [],
    painLocation: [],
    painScore: '',
    painCharacter: [],
    radiation: '',
    frequency: '',
    aggravatingFactors: [],
    relievingFactors: [],
    bowelMovementsPerDay: '',
    stoolConsistency: '',
    bloodInStool: '',
    mucusInStool: '',
    nocturnalBowelMovements: '',
    urgency: '',
    incontinence: '',
    alarmFeatures: [],
    alarmAcknowledged: false,
    alarmManagementPlan: '',
    familyHistory: [],
    lifestyleRisks: [],
    primaryDiagnosis: '',
    primaryDiagnosisCode: '',
    primaryDiagnosisId: '',
    secondaryDiagnosis: '',
    secondaryDiagnosisCode: '',
    secondaryDiagnosisId: '',
    clinicalImpression: '',
    providerNotes: '',
  };
}

export function createEmptyEndoscopyProcedure(defaults = {}) {
  return {
    id: newId(),
    procedureType: '',
    procedureStatus: 'Ordered',
    indication: '',
    scheduledDate: '',
    procedureDate: defaults.procedureDate || '',
    performingProvider: defaults.performingProvider || '',
    facility: '',
    preparationPrescribed: '',
    preparationCompleted: '',
    preparationQuality: '',
    findings: [],
    numberOfPolyps: '',
    largestSizeMm: '',
    polypLocation: '',
    polypRemoved: '',
    retrievalSuccessful: '',
    biopsyTaken: '',
    numberOfSpecimens: '',
    pathologyStatus: '',
    pathologyResult: '',
    dysplasia: '',
    malignancy: '',
    surveillanceInterval: '',
    nextEndoscopyDue: '',
    repeatProcedureRequired: '',
    patientNotified: '',
  };
}

export function createEmptyEndoscopyForm(defaults = {}) {
  return {
    procedures: [],
    activeProcedureId: null,
    defaultProvider: defaults.performingProvider || '',
  };
}

export function createEmptyIbdLiverForm() {
  return {
    diagnoses: [],
    diseaseStatus: '',
    currentFlare: '',
    symptomSeverity: '',
    hospitalizationSinceLastVisit: '',
    ibdAssessment: [],
    liverAssessment: [],
    cbcReviewed: '',
    crpReviewed: '',
    esrReviewed: '',
    fecalCalprotectin: '',
    ast: '',
    alt: '',
    bilirubin: '',
    albumin: '',
    inr: '',
    creatinine: '',
    imagingProcedures: [],
    vaccinations: [],
    colonCancerSurveillanceDue: '',
    hccSurveillanceDue: '',
    nextColonoscopyDue: '',
    nextLiverUltrasoundDue: '',
    nextLaboratoryReview: '',
    followUpInterval: '',
    primaryDiagnosis: '',
    primaryDiagnosisCode: '',
    primaryDiagnosisId: '',
    secondaryDiagnosis: '',
    secondaryDiagnosisCode: '',
    secondaryDiagnosisId: '',
    clinicalImpression: '',
    treatmentPlan: '',
    lifestyleCounseling: '',
    referrals: [],
    patientEducation: '',
  };
}

export function createEmptyAssessmentPlan() {
  return {
    primaryDiagnosis: '',
    primaryDiagnosisCode: '',
    primaryDiagnosisId: '',
    secondaryDiagnosis: '',
    secondaryDiagnosisCode: '',
    secondaryDiagnosisId: '',
    icd10Codes: [],
    clinicalImpression: '',
    treatmentPlan: '',
    lifestyleCounseling: '',
    referrals: [],
    patientEducation: '',
    followUpInterval: '',
    providerNotes: '',
    encounterSummary: '',
  };
}

export function createEmptyGastroenterologyState(defaults = {}) {
  return {
    symptoms: createEmptySymptomsForm(),
    endoscopy: createEmptyEndoscopyForm(defaults),
    ibdLiver: createEmptyIbdLiverForm(),
    plan: createEmptyAssessmentPlan(),
    reminders: [],
    auditLog: [],
    updatedAt: null,
  };
}

export function hasAlarmFeatures(symptoms) {
  return Array.isArray(symptoms?.alarmFeatures) && symptoms.alarmFeatures.length > 0;
}

export function alarmPlanRequired(symptoms) {
  return hasAlarmFeatures(symptoms) && !String(symptoms?.alarmManagementPlan || '').trim();
}

export function recommendedInvestigations(symptoms) {
  if (!hasAlarmFeatures(symptoms)) return [];
  return ALARM_INVESTIGATION_RECOMMENDATIONS;
}

/** Add months/years to an ISO date string based on surveillance interval label. */
export function computeSurveillanceDueDate(fromDate, interval) {
  if (!fromDate || !interval || interval === 'As Clinically Indicated') return '';
  const base = new Date(`${fromDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return '';
  const next = new Date(base);
  if (interval === '6 Months') next.setMonth(next.getMonth() + 6);
  else if (interval === '1 Year') next.setFullYear(next.getFullYear() + 1);
  else if (interval === '3 Years') next.setFullYear(next.getFullYear() + 3);
  else if (interval === '5 Years') next.setFullYear(next.getFullYear() + 5);
  else if (interval === '10 Years') next.setFullYear(next.getFullYear() + 10);
  else return '';
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mergeArray(saved, fallback = []) {
  return Array.isArray(saved) ? saved : fallback;
}

function applyCarryForward(patientId, state) {
  try {
    const raw = localStorage.getItem(carryKey(patientId));
    if (!raw) return state;
    const carry = JSON.parse(raw);
    const isFollowUp =
      state.symptoms.visitType === 'Follow-up' ||
      (!state.symptoms.visitType && Boolean(carry.hasPrior));
    if (!isFollowUp && state.symptoms.visitType === 'New Patient') return state;

    return {
      ...state,
      symptoms: {
        ...state.symptoms,
        visitType: state.symptoms.visitType || (carry.hasPrior ? 'Follow-up' : ''),
        familyHistory: state.symptoms.familyHistory?.length
          ? state.symptoms.familyHistory
          : carry.familyHistory || [],
        lifestyleRisks: state.symptoms.lifestyleRisks?.length
          ? state.symptoms.lifestyleRisks
          : carry.lifestyleRisks || [],
      },
      ibdLiver: {
        ...state.ibdLiver,
        diagnoses: state.ibdLiver.diagnoses?.length
          ? state.ibdLiver.diagnoses
          : carry.ibdDiagnoses || [],
        diseaseStatus: state.ibdLiver.diseaseStatus || carry.diseaseStatus || '',
        nextColonoscopyDue: state.ibdLiver.nextColonoscopyDue || carry.nextColonoscopyDue || '',
        nextLiverUltrasoundDue:
          state.ibdLiver.nextLiverUltrasoundDue || carry.nextLiverUltrasoundDue || '',
        followUpInterval: state.ibdLiver.followUpInterval || carry.followUpInterval || '',
      },
      plan: {
        ...state.plan,
        primaryDiagnosis: state.plan.primaryDiagnosis || carry.primaryDiagnosis || '',
        primaryDiagnosisCode: state.plan.primaryDiagnosisCode || carry.primaryDiagnosisCode || '',
        secondaryDiagnosis: state.plan.secondaryDiagnosis || carry.secondaryDiagnosis || '',
        secondaryDiagnosisCode:
          state.plan.secondaryDiagnosisCode || carry.secondaryDiagnosisCode || '',
        icd10Codes: state.plan.icd10Codes?.length ? state.plan.icd10Codes : carry.icd10Codes || [],
        followUpInterval: state.plan.followUpInterval || carry.followUpInterval || '',
      },
    };
  } catch {
    return state;
  }
}

export function loadGastroenterologyState(patientId, appointmentId, defaults = {}) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    if (!raw) {
      return applyCarryForward(patientId, createEmptyGastroenterologyState(defaults));
    }
    const parsed = JSON.parse(raw);
    const empty = createEmptyGastroenterologyState(defaults);
    const procedures = mergeArray(parsed.endoscopy?.procedures).map((p) => ({
      ...createEmptyEndoscopyProcedure(),
      ...p,
      findings: mergeArray(p.findings),
    }));

    return {
      symptoms: {
        ...empty.symptoms,
        ...(parsed.symptoms || {}),
        symptoms: mergeArray(parsed.symptoms?.symptoms),
        painLocation: mergeArray(parsed.symptoms?.painLocation),
        painCharacter: mergeArray(parsed.symptoms?.painCharacter),
        aggravatingFactors: mergeArray(parsed.symptoms?.aggravatingFactors),
        relievingFactors: mergeArray(parsed.symptoms?.relievingFactors),
        alarmFeatures: mergeArray(parsed.symptoms?.alarmFeatures),
        familyHistory: mergeArray(parsed.symptoms?.familyHistory),
        lifestyleRisks: mergeArray(parsed.symptoms?.lifestyleRisks),
      },
      endoscopy: {
        ...empty.endoscopy,
        procedures,
        activeProcedureId: parsed.endoscopy?.activeProcedureId || procedures[0]?.id || null,
        defaultProvider: parsed.endoscopy?.defaultProvider || defaults.performingProvider || '',
      },
      ibdLiver: {
        ...empty.ibdLiver,
        ...(parsed.ibdLiver || {}),
        diagnoses: mergeArray(parsed.ibdLiver?.diagnoses),
        ibdAssessment: mergeArray(parsed.ibdLiver?.ibdAssessment),
        liverAssessment: mergeArray(parsed.ibdLiver?.liverAssessment),
        imagingProcedures: mergeArray(parsed.ibdLiver?.imagingProcedures),
        vaccinations: mergeArray(parsed.ibdLiver?.vaccinations),
        referrals: mergeArray(parsed.ibdLiver?.referrals),
      },
      plan: {
        ...empty.plan,
        ...(parsed.plan || {}),
        icd10Codes: mergeArray(parsed.plan?.icd10Codes),
        referrals: mergeArray(parsed.plan?.referrals),
      },
      reminders: mergeArray(parsed.reminders),
      auditLog: mergeArray(parsed.auditLog),
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyGastroenterologyState(defaults);
  }
}

function buildReminders(state) {
  const reminders = [];
  if (hasAlarmFeatures(state.symptoms)) {
    reminders.push({
      id: 'alarm-features',
      type: 'alarm',
      label: 'Urgent GI evaluation recommended — alarm features documented',
      dueDate: null,
    });
  }
  for (const proc of state.endoscopy?.procedures || []) {
    if (proc.biopsyTaken === 'Yes' && proc.pathologyStatus && proc.pathologyStatus !== 'Resulted') {
      reminders.push({
        id: `path-${proc.id}`,
        type: 'pathology',
        label: `Pathology pending — ${proc.procedureType || 'endoscopy'}`,
        dueDate: null,
      });
    }
    if (proc.nextEndoscopyDue) {
      reminders.push({
        id: `surv-${proc.id}`,
        type: 'surveillance',
        label: `Next endoscopy due — ${proc.procedureType || 'procedure'}`,
        dueDate: proc.nextEndoscopyDue,
      });
    }
  }
  if (state.ibdLiver?.nextColonoscopyDue) {
    reminders.push({
      id: 'ibd-colo',
      type: 'surveillance',
      label: 'IBD / colon cancer surveillance colonoscopy due',
      dueDate: state.ibdLiver.nextColonoscopyDue,
    });
  }
  if (state.ibdLiver?.nextLiverUltrasoundDue || state.ibdLiver?.hccSurveillanceDue === 'Yes') {
    reminders.push({
      id: 'hcc-us',
      type: 'surveillance',
      label: 'HCC surveillance / liver ultrasound due',
      dueDate: state.ibdLiver.nextLiverUltrasoundDue || null,
    });
  }
  if (state.ibdLiver?.nextLaboratoryReview) {
    reminders.push({
      id: 'labs',
      type: 'labs',
      label: 'Laboratory review due',
      dueDate: state.ibdLiver.nextLaboratoryReview,
    });
  }
  return reminders;
}

function buildCarryPayload(state) {
  return {
    hasPrior: true,
    familyHistory: state.symptoms?.familyHistory || [],
    lifestyleRisks: state.symptoms?.lifestyleRisks || [],
    ibdDiagnoses: state.ibdLiver?.diagnoses || [],
    diseaseStatus: state.ibdLiver?.diseaseStatus || '',
    nextColonoscopyDue: state.ibdLiver?.nextColonoscopyDue || '',
    nextLiverUltrasoundDue: state.ibdLiver?.nextLiverUltrasoundDue || '',
    followUpInterval: state.plan?.followUpInterval || state.ibdLiver?.followUpInterval || '',
    primaryDiagnosis: state.plan?.primaryDiagnosis || '',
    primaryDiagnosisCode: state.plan?.primaryDiagnosisCode || '',
    secondaryDiagnosis: state.plan?.secondaryDiagnosis || '',
    secondaryDiagnosisCode: state.plan?.secondaryDiagnosisCode || '',
    icd10Codes: state.plan?.icd10Codes || [],
  };
}

function appendHistory(patientId, appointmentId, state) {
  try {
    const raw = localStorage.getItem(historyKey(patientId));
    const list = raw ? JSON.parse(raw) : [];
    const entry = {
      appointmentId: appointmentId || null,
      savedAt: state.updatedAt,
      visitType: state.symptoms?.visitType,
      alarmCount: state.symptoms?.alarmFeatures?.length || 0,
      procedureCount: state.endoscopy?.procedures?.length || 0,
      diseaseStatus: state.ibdLiver?.diseaseStatus || '',
      primaryDiagnosis: state.plan?.primaryDiagnosis || state.symptoms?.primaryDiagnosis || '',
      ast: state.ibdLiver?.ast || '',
      alt: state.ibdLiver?.alt || '',
      fecalCalprotectin: state.ibdLiver?.fecalCalprotectin || '',
    };
    const next = [entry, ...(Array.isArray(list) ? list : [])]
      .filter(
        (e, i, arr) =>
          arr.findIndex((x) => x.appointmentId === e.appointmentId && x.savedAt === e.savedAt) === i,
      )
      .slice(0, 40);
    localStorage.setItem(historyKey(patientId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function loadGastroenterologyHistory(patientId) {
  try {
    const raw = localStorage.getItem(historyKey(patientId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGastroenterologyState(patientId, appointmentId, state, { note } = {}) {
  if (alarmPlanRequired(state.symptoms)) {
    const err = new Error(
      'Document a management plan for GI alarm features before saving this encounter.',
    );
    err.code = 'ALARM_PLAN_REQUIRED';
    throw err;
  }

  const updatedAt = new Date().toISOString();
  const reminders = buildReminders(state);
  const auditEntry = {
    at: updatedAt,
    note: note || 'Saved Gastroenterology documentation',
    appointmentId: appointmentId || null,
  };
  const payload = {
    ...state,
    reminders,
    updatedAt,
    auditLog: [...(Array.isArray(state.auditLog) ? state.auditLog : []), auditEntry].slice(-50),
  };
  localStorage.setItem(storageKey(patientId, appointmentId), JSON.stringify(payload));
  localStorage.setItem(carryKey(patientId), JSON.stringify(buildCarryPayload(payload)));
  appendHistory(patientId, appointmentId, payload);
  return payload;
}

/** Build SOAP-friendly narrative from gastroenterology state. */
export function formatGastroenterologyForSoap(state) {
  if (!state) return { subjective: '', objective: '', assessment: '', plan: '' };

  const subjective = [
    state.symptoms?.chiefGiComplaint && `Chief GI complaint: ${state.symptoms.chiefGiComplaint}`,
    state.symptoms?.symptomDuration && `Duration: ${state.symptoms.symptomDuration}`,
    state.symptoms?.symptomOnset && `Onset: ${state.symptoms.symptomOnset}`,
    (state.symptoms?.symptoms || []).length &&
      `Symptoms: ${state.symptoms.symptoms.join(', ')}`,
    (state.symptoms?.alarmFeatures || []).length &&
      `Alarm features: ${state.symptoms.alarmFeatures.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const endoLines = (state.endoscopy?.procedures || []).map((p) =>
    [
      p.procedureType,
      p.procedureStatus,
      p.indication,
      (p.findings || []).length && `Findings: ${p.findings.join(', ')}`,
      p.pathologyResult && `Pathology: ${p.pathologyResult}`,
    ]
      .filter(Boolean)
      .join(' — '),
  );

  const objective = [
    state.symptoms?.painScore !== '' &&
      state.symptoms?.painScore != null &&
      `Pain score: ${state.symptoms.painScore}/10`,
    state.symptoms?.stoolConsistency && `Stool: ${state.symptoms.stoolConsistency}`,
    ...endoLines.map((line) => `Endoscopy: ${line}`),
    state.ibdLiver?.diseaseStatus && `Disease status: ${state.ibdLiver.diseaseStatus}`,
    [
      state.ibdLiver?.ast && `AST ${state.ibdLiver.ast}`,
      state.ibdLiver?.alt && `ALT ${state.ibdLiver.alt}`,
      state.ibdLiver?.bilirubin && `Bili ${state.ibdLiver.bilirubin}`,
      state.ibdLiver?.fecalCalprotectin && `Calprotectin ${state.ibdLiver.fecalCalprotectin}`,
    ]
      .filter(Boolean)
      .join('; '),
  ]
    .filter(Boolean)
    .join('\n');

  const assessment = [
    state.plan?.clinicalImpression || state.symptoms?.clinicalImpression || state.ibdLiver?.clinicalImpression,
    state.plan?.primaryDiagnosis &&
      `Primary: ${state.plan.primaryDiagnosis}${
        state.plan.primaryDiagnosisCode ? ` (${state.plan.primaryDiagnosisCode})` : ''
      }`,
    state.plan?.secondaryDiagnosis &&
      `Secondary: ${state.plan.secondaryDiagnosis}${
        state.plan.secondaryDiagnosisCode ? ` (${state.plan.secondaryDiagnosisCode})` : ''
      }`,
  ]
    .filter(Boolean)
    .join('\n');

  const plan = [
    state.plan?.treatmentPlan || state.ibdLiver?.treatmentPlan,
    state.symptoms?.alarmManagementPlan &&
      `Alarm feature plan: ${state.symptoms.alarmManagementPlan}`,
    state.plan?.followUpInterval && `Follow-up: ${state.plan.followUpInterval}`,
    (state.plan?.referrals || []).length && `Referrals: ${state.plan.referrals.join(', ')}`,
    state.plan?.patientEducation || state.ibdLiver?.patientEducation,
    state.plan?.encounterSummary,
  ]
    .filter(Boolean)
    .join('\n');

  return { subjective, objective, assessment, plan };
}
