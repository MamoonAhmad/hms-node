const STORAGE_PREFIX = 'hms:pmr-pt:';
const PATIENT_CARRY_PREFIX = 'hms:pmr-pt-carry:';

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

export function createEmptyFunctionalGoalsForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    primaryDiagnosis: '',
    functionalDomains: [],
    priorLevelOfFunction: '',
    currentLevelOfFunction: '',
    shortTermGoal: '',
    shortTermStatus: '',
    shortTermTimeframe: '',
    longTermGoal: '',
    longTermStatus: '',
    longTermTimeframe: '',
    barriers: [],
    barrierNotes: '',
    assistiveDevices: [],
    safetyConcerns: '',
    patientMotivation: '',
    clinicalNotes: '',
    followUpInterval: '',
  };
}

export function createEmptyPainRomStrengthForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    painLocation: '',
    painLocations: [],
    painAtRest: '',
    painWithActivity: '',
    painWorst: '',
    painBest: '',
    painQuality: [],
    painAggravators: '',
    painEasers: '',
    romJoint: '',
    romSide: '',
    romActive: '',
    romPassive: '',
    romEndFeel: '',
    romNotes: '',
    strengthJoint: '',
    strengthSide: '',
    strengthGrade: '',
    strengthNotes: '',
    specialTests: '',
    functionalMobility: '',
    clinicalNotes: '',
    followUpInterval: '',
  };
}

export function createEmptyTherapyAttendanceForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    therapyFrequency: '',
    sessionsAttended: '',
    sessionsScheduled: '',
    attendanceStatus: '',
    attendanceNotes: '',
    hepIssued: '',
    hepCompliance: '',
    hepExercises: '',
    hepBarriers: '',
    hepProgression: '',
    workStatus: '',
    workRestrictions: [],
    workRestrictionNotes: '',
    workRestrictionStart: '',
    workRestrictionEnd: '',
    returnToWorkPlan: '',
    clinicalNotes: '',
    followUpInterval: '',
  };
}

export function createEmptyPmrPtState(defaults = {}) {
  return {
    functionalGoals: createEmptyFunctionalGoalsForm(defaults),
    painRomStrength: createEmptyPainRomStrengthForm(defaults),
    therapyAttendance: createEmptyTherapyAttendanceForm(defaults),
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
      functionalGoals: {
        ...state.functionalGoals,
        primaryDiagnosis:
          state.functionalGoals.primaryDiagnosis || carry.primaryDiagnosis || '',
        shortTermGoal: state.functionalGoals.shortTermGoal || carry.shortTermGoal || '',
        longTermGoal: state.functionalGoals.longTermGoal || carry.longTermGoal || '',
        barriers: state.functionalGoals.barriers?.length
          ? state.functionalGoals.barriers
          : carry.barriers || [],
        assistiveDevices: state.functionalGoals.assistiveDevices?.length
          ? state.functionalGoals.assistiveDevices
          : carry.assistiveDevices || [],
      },
      painRomStrength: {
        ...state.painRomStrength,
        painLocation: state.painRomStrength.painLocation || carry.painLocation || '',
        romJoint: state.painRomStrength.romJoint || carry.romJoint || '',
      },
      therapyAttendance: {
        ...state.therapyAttendance,
        therapyFrequency:
          state.therapyAttendance.therapyFrequency || carry.therapyFrequency || '',
        hepExercises: state.therapyAttendance.hepExercises || carry.hepExercises || '',
        workStatus: state.therapyAttendance.workStatus || carry.workStatus || '',
        workRestrictions: state.therapyAttendance.workRestrictions?.length
          ? state.therapyAttendance.workRestrictions
          : carry.workRestrictions || [],
      },
    };
  } catch {
    return state;
  }
}

function buildCarryPayload(state) {
  return {
    primaryDiagnosis: state.functionalGoals?.primaryDiagnosis || '',
    shortTermGoal: state.functionalGoals?.shortTermGoal || '',
    longTermGoal: state.functionalGoals?.longTermGoal || '',
    barriers: state.functionalGoals?.barriers || [],
    assistiveDevices: state.functionalGoals?.assistiveDevices || [],
    painLocation: state.painRomStrength?.painLocation || '',
    romJoint: state.painRomStrength?.romJoint || '',
    therapyFrequency: state.therapyAttendance?.therapyFrequency || '',
    hepExercises: state.therapyAttendance?.hepExercises || '',
    workStatus: state.therapyAttendance?.workStatus || '',
    workRestrictions: state.therapyAttendance?.workRestrictions || [],
  };
}

export function loadPmrPtState(patientId, appointmentId, defaults = {}) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    if (!raw) {
      const empty = createEmptyPmrPtState(defaults);
      return applyCarryForward(patientId, empty);
    }
    const parsed = JSON.parse(raw);
    const base = createEmptyPmrPtState(defaults);
    return {
      functionalGoals: { ...base.functionalGoals, ...(parsed.functionalGoals || {}) },
      painRomStrength: { ...base.painRomStrength, ...(parsed.painRomStrength || {}) },
      therapyAttendance: { ...base.therapyAttendance, ...(parsed.therapyAttendance || {}) },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyPmrPtState(defaults);
  }
}

export function savePmrPtState(patientId, appointmentId, state, { note } = {}) {
  const updatedAt = new Date().toISOString();
  const auditEntry = {
    at: updatedAt,
    note: note || 'Saved PM&R / PT documentation',
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

/** Simple completion cue for header badge */
export function summarizePmrPtProgress(state) {
  const sections = [
    {
      id: 'functional-goals',
      done: Boolean(
        state?.functionalGoals?.shortTermGoal || state?.functionalGoals?.longTermGoal,
      ),
    },
    {
      id: 'pain-rom-strength',
      done: Boolean(
        state?.painRomStrength?.painAtRest ||
          state?.painRomStrength?.romActive ||
          state?.painRomStrength?.strengthGrade,
      ),
    },
    {
      id: 'therapy-attendance',
      done: Boolean(
        state?.therapyAttendance?.attendanceStatus ||
          state?.therapyAttendance?.hepCompliance ||
          state?.therapyAttendance?.workStatus,
      ),
    },
  ];
  const done = sections.filter((s) => s.done).length;
  return { done, total: sections.length, sections };
}
