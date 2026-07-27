import { ENT_SPECIALTY_ALIASES } from './entConstants';
import { getDepartmentBySlug } from '@/pages/others/departmentEncounterDepartments';

const STORAGE_PREFIX = 'hms:ent:';
const HISTORY_PREFIX = 'hms:ent-history:';

function storageKey(patientId, appointmentId) {
  return `${STORAGE_PREFIX}${patientId || 'unknown'}::${appointmentId || 'no-appt'}`;
}

function historyKey(patientId) {
  return `${HISTORY_PREFIX}${patientId || 'unknown'}`;
}

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeSpecialtyText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_/&]+/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Whether the ENT chart tab should be visible for this encounter. */
export function showEntTab({ appointment, chartSummary, departmentSlug } = {}) {
  if (departmentSlug === 'ent') return true;

  const entDept = getDepartmentBySlug('ent');
  const candidates = [
    chartSummary?.provider?.specialty,
    appointment?.provider?.specialty,
    appointment?.Provider?.specialty,
    appointment?.departmentRef?.departmentName,
    appointment?.department,
    appointment?.departmentName,
    appointment?.specialty,
  ]
    .map(normalizeSpecialtyText)
    .filter(Boolean);

  if (!candidates.length) return false;

  const aliases = [
    ...(ENT_SPECIALTY_ALIASES || []),
    ...(entDept?.aliases || []),
    entDept?.name,
    'ent',
  ]
    .map(normalizeSpecialtyText)
    .filter(Boolean);

  return candidates.some((text) =>
    aliases.some(
      (alias) => text === alias || text.includes(alias) || alias.includes(text),
    ),
  );
}

export function createEmptyEarSide() {
  return {
    tympanicMembrane: [],
    middleEar: [],
    mobility: '',
  };
}

export function createEmptyEarForm(defaults = {}) {
  return {
    examinationDate: defaults.examinationDate || todayInputValue(),
    provider: defaults.provider || '',
    visitType: '',
    chiefEarComplaint: '',
    durationOfSymptoms: '',
    affectedEar: '',
    symptoms: [],
    pinna: [],
    earCanal: [],
    mastoid: [],
    rightEar: createEmptyEarSide(),
    leftEar: createEmptyEarSide(),
    whisperTest: '',
    fingerRubTest: '',
    weberTest: '',
    rinneRight: '',
    rinneLeft: '',
    audiogramPerformed: '',
    audiogramDate: '',
    hearingLossType: '',
    severity: '',
    speechDiscrimination: '',
    tympanometry: '',
    audiogramUploaded: '',
    primaryDiagnosisCode: '',
    primaryDiagnosisDescription: '',
    primaryDiagnosisDisplay: '',
    secondaryDiagnosisCode: '',
    secondaryDiagnosisDescription: '',
    secondaryDiagnosisDisplay: '',
    clinicalImpression: '',
    providerNotes: '',
  };
}

export function createEmptyNoseForm() {
  return {
    symptoms: [],
    externalNose: [],
    nasalSeptum: [],
    turbinates: [],
    nasalMucosa: [],
    nasalDischarge: [],
    nasalPolyps: '',
    frontalSinusTenderness: '',
    maxillarySinusTenderness: '',
    ethmoidTenderness: '',
    sphenoidTenderness: '',
    allergies: [],
    diagnostics: [],
    diagnoses: [],
    otherDiagnosis: '',
    providerNotes: '',
  };
}

export function createEmptyThroatForm() {
  return {
    symptoms: [],
    lips: [],
    oralMucosa: [],
    tongue: [],
    teethGums: [],
    pharynx: [],
    tonsilGrade: '',
    neckExam: [],
    airwayPatent: '',
    stridor: '',
    respiratoryDistress: '',
    oxygenSaturation: '',
    voiceQuality: '',
    difficultyManagingSecretions: '',
    redFlags: {},
    redFlagAcknowledged: false,
    immediateManagementPlan: '',
    diagnostics: [],
    treatmentPlan: [],
    primaryDiagnosisCode: '',
    primaryDiagnosisDescription: '',
    primaryDiagnosisDisplay: '',
    secondaryDiagnosisCode: '',
    secondaryDiagnosisDescription: '',
    secondaryDiagnosisDisplay: '',
    clinicalImpression: '',
    managementPlan: '',
    followUpInterval: '',
    patientEducation: '',
  };
}

export function createEmptyEntState(defaults = {}) {
  return {
    ear: createEmptyEarForm(defaults),
    nose: createEmptyNoseForm(),
    throat: createEmptyThroatForm(),
    auditLog: [],
    updatedAt: null,
  };
}

function mergeEarSide(parsed, empty) {
  return {
    ...empty,
    ...(parsed || {}),
    tympanicMembrane: Array.isArray(parsed?.tympanicMembrane) ? parsed.tympanicMembrane : [],
    middleEar: Array.isArray(parsed?.middleEar) ? parsed.middleEar : [],
  };
}

export function loadEntState(patientId, appointmentId, defaults = {}) {
  try {
    const raw = localStorage.getItem(storageKey(patientId, appointmentId));
    const empty = createEmptyEntState(defaults);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      ear: {
        ...empty.ear,
        ...(parsed.ear || {}),
        examinationDate:
          parsed.ear?.examinationDate ||
          defaults.examinationDate ||
          empty.ear.examinationDate,
        provider: parsed.ear?.provider || defaults.provider || empty.ear.provider,
        symptoms: Array.isArray(parsed.ear?.symptoms) ? parsed.ear.symptoms : [],
        pinna: Array.isArray(parsed.ear?.pinna) ? parsed.ear.pinna : [],
        earCanal: Array.isArray(parsed.ear?.earCanal) ? parsed.ear.earCanal : [],
        mastoid: Array.isArray(parsed.ear?.mastoid) ? parsed.ear.mastoid : [],
        rightEar: mergeEarSide(parsed.ear?.rightEar, empty.ear.rightEar),
        leftEar: mergeEarSide(parsed.ear?.leftEar, empty.ear.leftEar),
      },
      nose: {
        ...empty.nose,
        ...(parsed.nose || {}),
        symptoms: Array.isArray(parsed.nose?.symptoms) ? parsed.nose.symptoms : [],
        externalNose: Array.isArray(parsed.nose?.externalNose) ? parsed.nose.externalNose : [],
        nasalSeptum: Array.isArray(parsed.nose?.nasalSeptum) ? parsed.nose.nasalSeptum : [],
        turbinates: Array.isArray(parsed.nose?.turbinates) ? parsed.nose.turbinates : [],
        nasalMucosa: Array.isArray(parsed.nose?.nasalMucosa) ? parsed.nose.nasalMucosa : [],
        nasalDischarge: Array.isArray(parsed.nose?.nasalDischarge)
          ? parsed.nose.nasalDischarge
          : [],
        allergies: Array.isArray(parsed.nose?.allergies) ? parsed.nose.allergies : [],
        diagnostics: Array.isArray(parsed.nose?.diagnostics) ? parsed.nose.diagnostics : [],
        diagnoses: Array.isArray(parsed.nose?.diagnoses) ? parsed.nose.diagnoses : [],
      },
      throat: {
        ...empty.throat,
        ...(parsed.throat || {}),
        symptoms: Array.isArray(parsed.throat?.symptoms) ? parsed.throat.symptoms : [],
        lips: Array.isArray(parsed.throat?.lips) ? parsed.throat.lips : [],
        oralMucosa: Array.isArray(parsed.throat?.oralMucosa) ? parsed.throat.oralMucosa : [],
        tongue: Array.isArray(parsed.throat?.tongue) ? parsed.throat.tongue : [],
        teethGums: Array.isArray(parsed.throat?.teethGums) ? parsed.throat.teethGums : [],
        pharynx: Array.isArray(parsed.throat?.pharynx) ? parsed.throat.pharynx : [],
        neckExam: Array.isArray(parsed.throat?.neckExam) ? parsed.throat.neckExam : [],
        diagnostics: Array.isArray(parsed.throat?.diagnostics) ? parsed.throat.diagnostics : [],
        treatmentPlan: Array.isArray(parsed.throat?.treatmentPlan)
          ? parsed.throat.treatmentPlan
          : [],
        redFlags:
          parsed.throat?.redFlags && typeof parsed.throat.redFlags === 'object'
            ? parsed.throat.redFlags
            : {},
        redFlagAcknowledged: Boolean(parsed.throat?.redFlagAcknowledged),
      },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return createEmptyEntState(defaults);
  }
}

export function getPresentAirwayRedFlags(throat = {}) {
  const flags = throat.redFlags || {};
  return Object.entries(flags)
    .filter(([, status]) => status === 'Present')
    .map(([name]) => name);
}

export function hasUnresolvedAirwayEmergency(throat = {}) {
  const present = getPresentAirwayRedFlags(throat);
  if (!present.length) return false;
  const plan = String(throat.immediateManagementPlan || '').trim();
  return !throat.redFlagAcknowledged || plan.length < 8;
}

export function canCompleteEntEncounter(patientId, appointmentId) {
  const state = loadEntState(patientId, appointmentId);
  return !hasUnresolvedAirwayEmergency(state.throat);
}

function buildHistoryEntry(state, appointmentId) {
  const presentFlags = getPresentAirwayRedFlags(state.throat);
  return {
    at: new Date().toISOString(),
    appointmentId: appointmentId || null,
    examinationDate: state.ear?.examinationDate || '',
    affectedEar: state.ear?.affectedEar || '',
    hearingLossType: state.ear?.hearingLossType || '',
    severity: state.ear?.severity || '',
    noseDiagnoses: state.nose?.diagnoses || [],
    tonsilGrade: state.throat?.tonsilGrade || '',
    airwayRedFlags: presentFlags,
    primaryEarDx: state.ear?.primaryDiagnosisDisplay || state.ear?.primaryDiagnosisCode || '',
    primaryThroatDx:
      state.throat?.primaryDiagnosisDisplay || state.throat?.primaryDiagnosisCode || '',
  };
}

export function loadEntHistory(patientId) {
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
  const prev = loadEntHistory(patientId);
  const next = [entry, ...prev.filter((e) => e.appointmentId !== entry.appointmentId)].slice(
    0,
    40,
  );
  localStorage.setItem(historyKey(patientId), JSON.stringify(next));
  return next;
}

export function saveEntState(patientId, appointmentId, state) {
  const updatedAt = new Date().toISOString();
  const presentFlags = getPresentAirwayRedFlags(state.throat);
  const note = presentFlags.length
    ? `Saved ENT documentation (airway red flags: ${presentFlags.join(', ')})`
    : 'Saved ENT documentation';
  const auditEntry = {
    at: updatedAt,
    note,
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
