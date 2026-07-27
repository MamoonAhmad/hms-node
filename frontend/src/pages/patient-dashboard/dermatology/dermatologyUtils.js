const STORAGE_PREFIX = 'hms:dermatology:';
const PATIENT_CARRY_PREFIX = 'hms:dermatology-carry:';
const HISTORY_PREFIX = 'hms:dermatology-history:';

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
  return `derm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyLesion() {
  return {
    id: newId(),
    label: '',
    bodyLocations: [],
    lesionPresent: '',
    numberOfLesions: '',
    primaryDiagnosisCode: '',
    primaryDiagnosisDescription: '',
    primaryDiagnosisId: '',
    clinicalDiagnosis: '',
    primaryMorphology: [],
    secondaryMorphology: [],
    colours: [],
    borders: [],
    surfaces: [],
    shapes: [],
    distributions: [],
    lengthMm: '',
    widthMm: '',
    heightMm: '',
    symptoms: [],
    associatedFindings: [],
    abcde: {
      asymmetry: '',
      borderIrregularity: '',
      colourVariation: '',
      diameterOver6mm: '',
      evolution: '',
    },
    photography: {
      photographTaken: false,
      imageUploaded: false,
      consentObtained: false,
      lesionMarked: false,
    },
    photos: [],
    biopsyStatus: 'None',
    notes: '',
  };
}

export function createEmptyExamForm() {
  return {
    examinationType: '',
    visitType: '',
    bodyExamination: '',
    examBodyLocations: [],
    providerNotes: '',
    activeLesionId: null,
    lesions: [createEmptyLesion()],
  };
}

export function createEmptyBiopsyForm() {
  return {
    procedures: [],
  };
}

export function createEmptyBiopsyProcedure(defaults = {}) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: newId(),
    lesionId: defaults.lesionId || '',
    procedureDate: defaults.procedureDate || today,
    performingProvider: defaults.performingProvider || '',
    procedureType: '',
    indication: '',
    bodySite: '',
    laterality: '',
    lesionNumber: defaults.lesionNumber || '',
    clinicalDiagnosis: defaults.clinicalDiagnosis || '',
    lesionSize: defaults.lesionSize || '',
    lesionLocation: defaults.lesionLocation || '',
    pigmented: '',
    suspiciousForMalignancy: '',
    localAnaesthetic: '',
    concentration: '',
    volume: '',
    epinephrineUsed: '',
    bufferUsed: '',
    skinPrepared: '',
    prepSolution: '',
    instrumentUsed: '',
    punchSize: '',
    excisionLength: '',
    excisionWidth: '',
    specimenOrientation: '',
    numberOfSpecimens: '',
    specimenSentToPathology: '',
    haemostasis: [],
    closure: '',
    dressing: {
      bandageApplied: false,
      pressureDressing: false,
      antibioticOintment: false,
      woundCareInstructionsGiven: false,
    },
    specimenLabel: '',
    containerNumber: '',
    pathologyLaboratory: '',
    pathologyOrderNumber: '',
    pathologyStatus: 'Pending',
    complications: [],
    complicationOther: '',
    pathologyFollowUp: '',
    sutureRemovalDate: '',
    returnVisit: '',
    providerNotes: '',
    reminderGenerated: false,
  };
}

export function createEmptyTreatmentPlan() {
  return {
    primaryDiagnosis: '',
    primaryDiagnosisCode: '',
    primaryDiagnosisId: '',
    secondaryDiagnosis: '',
    secondaryDiagnosisCode: '',
    secondaryDiagnosisId: '',
    icd10Codes: [],
    linkedMedicationOrderIds: [],
    medicationNotes: '',
    officeProcedures: [],
    dressingInstructions: '',
    cleansingInstructions: '',
    activityRestrictions: '',
    returnPrecautions: '',
    skinCareRecommendations: [],
    patientEducation: [],
    followUpInterval: '',
    reBiopsyRequired: '',
    repeatExamination: '',
    dermatopathologyReview: '',
    referrals: [],
    outcome: '',
    clinicalImpression: '',
    treatmentResponse: '',
    longTermManagementPlan: '',
    additionalRecommendations: '',
    encounterSummary: '',
  };
}

export function createEmptyDermatologyState() {
  const exam = createEmptyExamForm();
  exam.activeLesionId = exam.lesions[0].id;
  return {
    exam,
    biopsy: createEmptyBiopsyForm(),
    plan: createEmptyTreatmentPlan(),
    reminders: [],
    auditLog: [],
    updatedAt: null,
  };
}

function mergeLesion(defaults, saved) {
  return {
    ...defaults,
    ...saved,
    id: saved?.id || defaults.id,
    bodyLocations: Array.isArray(saved?.bodyLocations) ? saved.bodyLocations : defaults.bodyLocations,
    primaryMorphology: Array.isArray(saved?.primaryMorphology)
      ? saved.primaryMorphology
      : defaults.primaryMorphology,
    secondaryMorphology: Array.isArray(saved?.secondaryMorphology)
      ? saved.secondaryMorphology
      : defaults.secondaryMorphology,
    colours: Array.isArray(saved?.colours) ? saved.colours : defaults.colours,
    borders: Array.isArray(saved?.borders) ? saved.borders : defaults.borders,
    surfaces: Array.isArray(saved?.surfaces) ? saved.surfaces : defaults.surfaces,
    shapes: Array.isArray(saved?.shapes) ? saved.shapes : defaults.shapes,
    distributions: Array.isArray(saved?.distributions) ? saved.distributions : defaults.distributions,
    symptoms: Array.isArray(saved?.symptoms) ? saved.symptoms : defaults.symptoms,
    associatedFindings: Array.isArray(saved?.associatedFindings)
      ? saved.associatedFindings
      : defaults.associatedFindings,
    abcde: { ...defaults.abcde, ...(saved?.abcde || {}) },
    photography: { ...defaults.photography, ...(saved?.photography || {}) },
    photos: Array.isArray(saved?.photos) ? saved.photos : defaults.photos,
  };
}

function applyCarryForward(patientId, state) {
  try {
    const raw = localStorage.getItem(carryKey(patientId));
    if (!raw) return state;
    const carry = JSON.parse(raw);
    const isFollowUp =
      state.exam.visitType === 'Follow-up' ||
      state.exam.examinationType === 'Follow-up' ||
      (!state.exam.visitType && Boolean(carry.hasPrior));

    if (!isFollowUp && state.exam.visitType === 'New Patient') return state;

    const carriedLesions = Array.isArray(carry.activeLesions) ? carry.activeLesions : [];
    const lesions =
      carriedLesions.length > 0
        ? carriedLesions.map((l) => mergeLesion(createEmptyLesion(), { ...l, photos: [] }))
        : state.exam.lesions;

    return {
      ...state,
      exam: {
        ...state.exam,
        visitType: state.exam.visitType || (carry.hasPrior ? 'Follow-up' : ''),
        examinationType: state.exam.examinationType || (carry.hasPrior ? 'Follow-up' : ''),
        examBodyLocations: state.exam.examBodyLocations?.length
          ? state.exam.examBodyLocations
          : carry.examBodyLocations || [],
        lesions,
        activeLesionId: lesions[0]?.id || state.exam.activeLesionId,
        providerNotes: state.exam.providerNotes || '',
      },
      plan: {
        ...state.plan,
        primaryDiagnosis: state.plan.primaryDiagnosis || carry.primaryDiagnosis || '',
        primaryDiagnosisCode: state.plan.primaryDiagnosisCode || carry.primaryDiagnosisCode || '',
        secondaryDiagnosis: state.plan.secondaryDiagnosis || carry.secondaryDiagnosis || '',
        secondaryDiagnosisCode:
          state.plan.secondaryDiagnosisCode || carry.secondaryDiagnosisCode || '',
        icd10Codes: state.plan.icd10Codes?.length ? state.plan.icd10Codes : carry.icd10Codes || [],
        skinCareRecommendations: state.plan.skinCareRecommendations?.length
          ? state.plan.skinCareRecommendations
          : carry.skinCareRecommendations || [],
        longTermManagementPlan:
          state.plan.longTermManagementPlan || carry.longTermManagementPlan || '',
        followUpInterval: state.plan.followUpInterval || carry.followUpInterval || '',
      },
    };
  } catch {
    return state;
  }
}

export function loadDermatologyState(patientId, appointmentId) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    if (!raw) {
      return applyCarryForward(patientId, createEmptyDermatologyState());
    }
    const parsed = JSON.parse(raw);
    const defaults = createEmptyDermatologyState();
    const lesions = Array.isArray(parsed.exam?.lesions) && parsed.exam.lesions.length
      ? parsed.exam.lesions.map((l) => mergeLesion(createEmptyLesion(), l))
      : defaults.exam.lesions;

    return {
      exam: {
        ...defaults.exam,
        ...(parsed.exam || {}),
        lesions,
        activeLesionId: parsed.exam?.activeLesionId || lesions[0]?.id,
        examBodyLocations: Array.isArray(parsed.exam?.examBodyLocations)
          ? parsed.exam.examBodyLocations
          : [],
      },
      biopsy: {
        procedures: Array.isArray(parsed.biopsy?.procedures)
          ? parsed.biopsy.procedures.map((p) => ({
              ...createEmptyBiopsyProcedure(),
              ...p,
              haemostasis: Array.isArray(p.haemostasis) ? p.haemostasis : [],
              complications: Array.isArray(p.complications) ? p.complications : [],
              dressing: {
                ...createEmptyBiopsyProcedure().dressing,
                ...(p.dressing || {}),
              },
            }))
          : [],
      },
      plan: {
        ...defaults.plan,
        ...(parsed.plan || {}),
        icd10Codes: Array.isArray(parsed.plan?.icd10Codes) ? parsed.plan.icd10Codes : [],
        linkedMedicationOrderIds: Array.isArray(parsed.plan?.linkedMedicationOrderIds)
          ? parsed.plan.linkedMedicationOrderIds
          : [],
        officeProcedures: Array.isArray(parsed.plan?.officeProcedures)
          ? parsed.plan.officeProcedures
          : [],
        skinCareRecommendations: Array.isArray(parsed.plan?.skinCareRecommendations)
          ? parsed.plan.skinCareRecommendations
          : [],
        patientEducation: Array.isArray(parsed.plan?.patientEducation)
          ? parsed.plan.patientEducation
          : [],
        referrals: Array.isArray(parsed.plan?.referrals) ? parsed.plan.referrals : [],
      },
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyDermatologyState();
  }
}

function buildReminders(state) {
  const reminders = [];
  for (const proc of state.biopsy?.procedures || []) {
    if (proc.specimenSentToPathology === 'Yes' && proc.pathologyStatus !== 'Resulted') {
      reminders.push({
        id: `path-${proc.id}`,
        type: 'pathology',
        label: `Pathology pending — ${proc.specimenLabel || proc.bodySite || 'biopsy'}`,
        procedureId: proc.id,
        dueDate: null,
      });
    }
    if (proc.sutureRemovalDate) {
      reminders.push({
        id: `suture-${proc.id}`,
        type: 'suture-removal',
        label: `Suture removal — ${proc.bodySite || 'site'}`,
        procedureId: proc.id,
        dueDate: proc.sutureRemovalDate,
      });
    }
    if (proc.returnVisit) {
      reminders.push({
        id: `return-${proc.id}`,
        type: 'return-visit',
        label: `Return visit — ${proc.returnVisit}`,
        procedureId: proc.id,
        dueDate: null,
      });
    }
  }
  if (state.plan?.dermatopathologyReview === 'Yes') {
    reminders.push({
      id: 'dermpath-review',
      type: 'dermatopathology-review',
      label: 'Dermatopathology review required',
      dueDate: null,
    });
  }
  return reminders;
}

function buildCarryPayload(state) {
  const activeLesions = (state.exam?.lesions || [])
    .filter((l) => l.lesionPresent !== 'No')
    .map((l) => ({
      ...l,
      photos: [],
      photography: { ...l.photography, imageUploaded: false },
    }));

  return {
    hasPrior: true,
    examBodyLocations: state.exam?.examBodyLocations || [],
    activeLesions,
    primaryDiagnosis: state.plan?.primaryDiagnosis || '',
    primaryDiagnosisCode: state.plan?.primaryDiagnosisCode || '',
    secondaryDiagnosis: state.plan?.secondaryDiagnosis || '',
    secondaryDiagnosisCode: state.plan?.secondaryDiagnosisCode || '',
    icd10Codes: state.plan?.icd10Codes || [],
    skinCareRecommendations: state.plan?.skinCareRecommendations || [],
    longTermManagementPlan: state.plan?.longTermManagementPlan || '',
    followUpInterval: state.plan?.followUpInterval || '',
  };
}

function appendHistory(patientId, appointmentId, state) {
  try {
    const raw = localStorage.getItem(historyKey(patientId));
    const list = raw ? JSON.parse(raw) : [];
    const entry = {
      appointmentId: appointmentId || null,
      savedAt: state.updatedAt,
      examinationType: state.exam?.examinationType,
      visitType: state.exam?.visitType,
      lesionCount: state.exam?.lesions?.length || 0,
      biopsyCount: state.biopsy?.procedures?.length || 0,
      outcome: state.plan?.outcome || '',
      summary: state.plan?.encounterSummary || '',
    };
    const next = [entry, ...(Array.isArray(list) ? list : [])]
      .filter((e, i, arr) => arr.findIndex((x) => x.appointmentId === e.appointmentId && x.savedAt === e.savedAt) === i)
      .slice(0, 30);
    localStorage.setItem(historyKey(patientId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function loadDermatologyHistory(patientId) {
  try {
    const raw = localStorage.getItem(historyKey(patientId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDermatologyState(patientId, appointmentId, state, { note } = {}) {
  const updatedAt = new Date().toISOString();
  const reminders = buildReminders(state);
  const auditEntry = {
    at: updatedAt,
    note: note || 'Saved Dermatology documentation',
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

export function toggleListValue(list, value) {
  const current = Array.isArray(list) ? list : [];
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}

export function formatLesionLabel(lesion, index) {
  if (lesion?.label) return lesion.label;
  const site = lesion?.bodyLocations?.[0];
  const morph = lesion?.primaryMorphology?.[0];
  const parts = [site, morph].filter(Boolean);
  return parts.length ? `Lesion ${index + 1}: ${parts.join(' — ')}` : `Lesion ${index + 1}`;
}

export function lesionSizeSummary(lesion) {
  const parts = [lesion?.lengthMm, lesion?.widthMm, lesion?.heightMm].filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return `${parts[0]} mm`;
  if (parts.length === 2) return `${parts[0]} × ${parts[1]} mm`;
  return `${parts[0]} × ${parts[1]} × ${parts[2]} mm`;
}

/** Build SOAP-friendly narrative from dermatology state. */
export function formatDermatologyForSoap(state) {
  if (!state) return { objective: '', assessment: '', plan: '' };
  const lesionLines = (state.exam?.lesions || []).map((l, i) => {
    const label = formatLesionLabel(l, i);
    const morph = [...(l.primaryMorphology || []), ...(l.secondaryMorphology || [])].join(', ');
    const sites = (l.bodyLocations || []).join(', ');
    const size = lesionSizeSummary(l);
    const dx = l.clinicalDiagnosis || l.primaryDiagnosisCode || '';
    return [
      label,
      sites && `Site: ${sites}`,
      morph && `Morphology: ${morph}`,
      size && `Size: ${size}`,
      dx && `Dx: ${dx}`,
      (l.symptoms || []).length && `Symptoms: ${l.symptoms.join(', ')}`,
    ]
      .filter(Boolean)
      .join('; ');
  });

  const biopsyLines = (state.biopsy?.procedures || []).map((p) =>
    [
      p.procedureType,
      p.bodySite,
      p.laterality,
      p.specimenLabel && `Specimen ${p.specimenLabel}`,
      p.pathologyStatus,
    ]
      .filter(Boolean)
      .join(' — '),
  );

  const objective = [
    state.exam?.examinationType && `Exam type: ${state.exam.examinationType}`,
    state.exam?.bodyExamination && `Body exam: ${state.exam.bodyExamination}`,
    ...lesionLines,
    ...biopsyLines.map((b) => `Biopsy: ${b}`),
  ]
    .filter(Boolean)
    .join('\n');

  const assessment = [
    state.plan?.clinicalImpression,
    state.plan?.primaryDiagnosis &&
      `Primary: ${state.plan.primaryDiagnosis}${
        state.plan.primaryDiagnosisCode ? ` (${state.plan.primaryDiagnosisCode})` : ''
      }`,
    state.plan?.secondaryDiagnosis &&
      `Secondary: ${state.plan.secondaryDiagnosis}${
        state.plan.secondaryDiagnosisCode ? ` (${state.plan.secondaryDiagnosisCode})` : ''
      }`,
    state.plan?.outcome && `Outcome: ${state.plan.outcome}`,
  ]
    .filter(Boolean)
    .join('\n');

  const plan = [
    state.plan?.longTermManagementPlan,
    (state.plan?.officeProcedures || []).length &&
      `Office procedures: ${state.plan.officeProcedures.join(', ')}`,
    state.plan?.followUpInterval && `Follow-up: ${state.plan.followUpInterval}`,
    (state.plan?.referrals || []).length && `Referrals: ${state.plan.referrals.join(', ')}`,
    state.plan?.additionalRecommendations,
    state.plan?.encounterSummary,
  ]
    .filter(Boolean)
    .join('\n');

  return { objective, assessment, plan };
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
