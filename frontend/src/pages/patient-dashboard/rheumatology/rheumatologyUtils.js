import { BIOLOGIC_RISK_QUESTIONS, JOINT_28_SET } from './rheumatologyConstants';

const STORAGE_PREFIX = 'hms:rheumatology:';
const CARRY_PREFIX = 'hms:rheumatology-carry:';

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

export function createEmptyJointMap() {
  return Object.fromEntries(
    JOINT_28_SET.map((j) => [j.id, { tender: false, swollen: false }]),
  );
}

export function createEmptyJointCountForm() {
  return {
    assessedAt: todayInputValue(),
    method: '28-joint (DAS28)',
    joints: createEmptyJointMap(),
    tenderOverride: '',
    swollenOverride: '',
    morningStiffness: '',
    morningStiffnessMinutes: '',
    painVas: '',
    patientGlobalVas: '',
    physicianGlobalVas: '',
    notes: '',
  };
}

export function createEmptyFlareForm() {
  return {
    assessedAt: todayInputValue(),
    inFlare: '',
    onsetDate: '',
    severity: '',
    triggers: [],
    jointsInvolved: '',
    systemicSymptoms: [],
    functionalImpact: '',
    currentTherapy: '',
    responseToTherapy: '',
    actions: [],
    plan: '',
    notes: '',
  };
}

export function createEmptyBiologicRiskResponses() {
  return BIOLOGIC_RISK_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 'no' }), {});
}

export function createEmptyBiologicRiskForm() {
  return {
    assessedAt: todayInputValue(),
    plannedTherapy: '',
    responses: createEmptyBiologicRiskResponses(),
    tbStatus: '',
    hepBStatus: '',
    hepCStatus: '',
    vaccineChecks: [],
    labsReviewed: '',
    clearance: '',
    precautions: '',
    notes: '',
  };
}

export function createEmptyRheumatologyState() {
  return {
    jointCount: createEmptyJointCountForm(),
    flare: createEmptyFlareForm(),
    biologicRisk: createEmptyBiologicRiskForm(),
    auditLog: [],
    updatedAt: null,
  };
}

export function countJointsFromMap(joints = {}, key) {
  return JOINT_28_SET.reduce((sum, j) => (joints[j.id]?.[key] ? sum + 1 : sum), 0);
}

export function resolveJointCounts(form = {}) {
  const fromMapTender = countJointsFromMap(form.joints, 'tender');
  const fromMapSwollen = countJointsFromMap(form.joints, 'swollen');
  const tenderOverride = form.tenderOverride === '' ? null : Number(form.tenderOverride);
  const swollenOverride = form.swollenOverride === '' ? null : Number(form.swollenOverride);
  return {
    tender:
      Number.isFinite(tenderOverride) && tenderOverride >= 0 ? tenderOverride : fromMapTender,
    swollen:
      Number.isFinite(swollenOverride) && swollenOverride >= 0
        ? swollenOverride
        : fromMapSwollen,
    fromMapTender,
    fromMapSwollen,
  };
}

export function interpretJointActivity(tender, swollen) {
  const total = tender + swollen;
  if (total === 0) {
    return {
      label: 'No active joint findings',
      variant: 'success',
      interpretation: 'No tender or swollen joints documented on this exam.',
    };
  }
  if (total <= 4 && swollen <= 2) {
    return {
      label: 'Low joint activity',
      variant: 'info',
      interpretation: `${tender} tender / ${swollen} swollen — correlate with labs and patient global.`,
    };
  }
  if (total <= 10 || swollen <= 5) {
    return {
      label: 'Moderate joint activity',
      variant: 'warning',
      interpretation: `${tender} tender / ${swollen} swollen — consider flare workup if clinically indicated.`,
    };
  }
  return {
    label: 'High joint activity',
    variant: 'danger',
    interpretation: `${tender} tender / ${swollen} swollen — escalate therapy review and document flare status.`,
  };
}

export function interpretFlare(form = {}) {
  if (form.inFlare !== 'Yes') {
    return {
      label: form.inFlare === 'No' ? 'No active flare' : 'Flare status not set',
      variant: form.inFlare === 'No' ? 'success' : 'muted',
      interpretation:
        form.inFlare === 'No'
          ? 'Patient not in flare on this assessment.'
          : 'Document whether the patient is currently in flare.',
    };
  }
  if (form.severity === 'Severe' || form.severity === 'Life-threatening') {
    return {
      label: `${form.severity} flare`,
      variant: 'danger',
      interpretation: 'Urgent management plan required; consider same-day escalation.',
    };
  }
  if (form.severity === 'Moderate') {
    return {
      label: 'Moderate flare',
      variant: 'warning',
      interpretation: 'Bridge therapy and close follow-up recommended.',
    };
  }
  return {
    label: form.severity ? `${form.severity} flare` : 'Flare present',
    variant: 'warning',
    interpretation: 'Document triggers, functional impact, and action plan.',
  };
}

export function interpretBiologicRisk(responses = {}, clearance = '') {
  const blocking = BIOLOGIC_RISK_QUESTIONS.filter(
    (q) => q.yesBlocks && responses[q.id] === 'yes',
  );
  const caution = BIOLOGIC_RISK_QUESTIONS.filter(
    (q) => !q.yesBlocks && responses[q.id] === 'yes',
  );

  if (blocking.length > 0) {
    return {
      label: 'High infection risk — defer biologic',
      variant: 'danger',
      interpretation: `${blocking.length} blocking risk factor(s). Treat / complete workup before start or escalate.`,
    };
  }
  if (
    clearance === 'Defer — complete screening' ||
    clearance === 'Defer — treat infection first' ||
    clearance === 'Contraindicated at this time'
  ) {
    return {
      label: clearance,
      variant: 'danger',
      interpretation: 'Do not start or escalate biologic until clearance criteria are met.',
    };
  }
  if (caution.length > 0 || clearance === 'Cleared with precautions') {
    return {
      label: 'Proceed with precautions',
      variant: 'warning',
      interpretation: `${caution.length} caution item(s). Document mitigation and counseling.`,
    };
  }
  if (clearance === 'Cleared to start / continue') {
    return {
      label: 'Cleared for biologic',
      variant: 'success',
      interpretation: 'No blocking infection-risk findings documented.',
    };
  }
  return {
    label: 'Screen incomplete',
    variant: 'muted',
    interpretation: 'Complete checklist, serologies, and clearance decision.',
  };
}

function applyCarryForward(patientId, state) {
  try {
    const raw = localStorage.getItem(carryKey(patientId));
    if (!raw) return state;
    const carry = JSON.parse(raw);
    return {
      ...state,
      biologicRisk: {
        ...state.biologicRisk,
        plannedTherapy: state.biologicRisk.plannedTherapy || carry.plannedTherapy || '',
        tbStatus: state.biologicRisk.tbStatus || carry.tbStatus || '',
        hepBStatus: state.biologicRisk.hepBStatus || carry.hepBStatus || '',
        hepCStatus: state.biologicRisk.hepCStatus || carry.hepCStatus || '',
        vaccineChecks: state.biologicRisk.vaccineChecks?.length
          ? state.biologicRisk.vaccineChecks
          : carry.vaccineChecks || [],
      },
      jointCount: {
        ...state.jointCount,
        method: state.jointCount.method || carry.jointMethod || state.jointCount.method,
      },
    };
  } catch {
    return state;
  }
}

export function loadRheumatologyState(patientId, appointmentId) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    if (!raw) {
      return applyCarryForward(patientId, createEmptyRheumatologyState());
    }
    const parsed = JSON.parse(raw);
    const defaults = createEmptyRheumatologyState();
    return {
      jointCount: {
        ...defaults.jointCount,
        ...(parsed.jointCount || {}),
        joints: { ...defaults.jointCount.joints, ...(parsed.jointCount?.joints || {}) },
      },
      flare: {
        ...defaults.flare,
        ...(parsed.flare || {}),
        triggers: Array.isArray(parsed.flare?.triggers) ? parsed.flare.triggers : [],
        systemicSymptoms: Array.isArray(parsed.flare?.systemicSymptoms)
          ? parsed.flare.systemicSymptoms
          : [],
        actions: Array.isArray(parsed.flare?.actions) ? parsed.flare.actions : [],
      },
      biologicRisk: {
        ...defaults.biologicRisk,
        ...(parsed.biologicRisk || {}),
        responses: {
          ...defaults.biologicRisk.responses,
          ...(parsed.biologicRisk?.responses || {}),
        },
        vaccineChecks: Array.isArray(parsed.biologicRisk?.vaccineChecks)
          ? parsed.biologicRisk.vaccineChecks
          : [],
      },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyRheumatologyState();
  }
}

function buildCarryPayload(state) {
  return {
    plannedTherapy: state.biologicRisk?.plannedTherapy || '',
    tbStatus: state.biologicRisk?.tbStatus || '',
    hepBStatus: state.biologicRisk?.hepBStatus || '',
    hepCStatus: state.biologicRisk?.hepCStatus || '',
    vaccineChecks: state.biologicRisk?.vaccineChecks || [],
    jointMethod: state.jointCount?.method || '',
  };
}

export function saveRheumatologyState(patientId, appointmentId, state, { note } = {}) {
  const updatedAt = new Date().toISOString();
  const auditEntry = {
    at: updatedAt,
    note: note || 'Saved Rheumatology documentation',
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
