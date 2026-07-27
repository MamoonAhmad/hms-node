import {
  INTAKE_SECTIONS,
  SCREENING_LABELS,
  buildHpiNarrative,
} from '../intake/intakeConstants';
import { intakeApi } from '@/services/api/intake.api';
import { referralApi } from '@/services/api/referral.api';
import { patientProblemApi } from '@/services/api/patientProblem.api';
import { encounterProblemApi } from '@/services/api/encounterProblem.api';
import {
  formatDermatologyForSoap,
  loadDermatologyState,
} from '../dermatology/dermatologyUtils';
import {
  formatGastroenterologyForSoap,
  loadGastroenterologyState,
} from '../gastroenterology/gastroenterologyUtils';

function latestBySection(records, sectionType) {
  return (records || []).find((r) => r.sectionType === sectionType) || null;
}

function allBySection(records, sectionType) {
  return (records || []).filter((r) => r.sectionType === sectionType);
}

export function formatRosNarrative(payload) {
  if (!payload) return '';
  if (payload.markAllNegative) {
    return 'All systems reviewed and marked negative.';
  }
  const lines = [];
  const sectionNegative = payload.sectionNegative || {};
  const selections = payload.selections || {};
  const otherTexts = payload.otherTexts || {};

  Object.keys(sectionNegative).forEach((title) => {
    if (sectionNegative[title]) {
      lines.push(`${title}: negative`);
      return;
    }
    const positives = [];
    const negatives = [];
    Object.entries(selections).forEach(([key, value]) => {
      if (!key.startsWith(`${title}-`)) return;
      const item = key.slice(title.length + 1);
      if (value === 'yes') {
        const other = item === 'Other' && otherTexts[key] ? ` (${otherTexts[key]})` : '';
        positives.push(`${item}${other}`);
      } else if (value === 'no') {
        negatives.push(item);
      }
    });
    if (positives.length) {
      lines.push(`${title}: + ${positives.join(', ')}`);
    } else if (negatives.length) {
      lines.push(`${title}: reviewed (no positives)`);
    }
  });

  if (payload.notes) lines.push(`Notes: ${payload.notes}`);
  return lines.join('\n');
}

export function formatCurrentMedications(records) {
  const lines = [];
  for (const r of records) {
    if (r.payload?.noMedication) {
      lines.push('No current medications reported.');
      continue;
    }
    for (const m of r.payload?.medications || []) {
      const parts = [
        m.medicationName,
        m.dose,
        m.route,
        m.frequency,
        m.action,
      ].filter(Boolean);
      if (parts.length) lines.push(parts.join(' — '));
    }
  }
  return lines.join('\n');
}

export function formatPastMedicalHistory(records) {
  return records
    .map((r) => {
      const p = r.payload || {};
      const bits = [p.conditionName];
      if (p.conditionCode) bits.push(`(${p.conditionCode})`);
      if (p.status) bits.push(`— ${p.status}`);
      if (p.severity) bits.push(p.severity);
      if (p.onsetDate || p.ageAtOnset) bits.push(`onset ${p.onsetDate || `age ${p.ageAtOnset}`}`);
      return bits.filter(Boolean).join(' ');
    })
    .filter(Boolean)
    .join('\n');
}

export function formatSurgicalHistory(records) {
  return records
    .map((r) => {
      const p = r.payload || {};
      const bits = [p.procedureName || p.cptCode];
      if (p.cptCode && p.procedureName) bits[0] = `${p.cptCode} — ${p.procedureName}`;
      if (p.procedureDate) bits.push(`(${p.procedureDate})`);
      if (p.surgeon) bits.push(`Surgeon: ${p.surgeon}`);
      if (p.outcome) bits.push(p.outcome);
      if (p.complications) bits.push(`Complications: ${p.complications}`);
      return bits.filter(Boolean).join(' — ');
    })
    .filter(Boolean)
    .join('\n');
}

export function formatSocialHistory(payload) {
  if (!payload) return '';
  const lines = [];
  if (payload.tobacco?.status) {
    const t = payload.tobacco;
    lines.push(
      `Tobacco: ${t.status}${t.packsPerDay ? `, ${t.packsPerDay} ppd` : ''}${t.years ? `, ${t.years} years` : ''}${t.quitDate ? `, quit ${t.quitDate}` : ''}`,
    );
  }
  if (payload.alcohol?.status) {
    const a = payload.alcohol;
    lines.push(
      `Alcohol: ${a.status}${a.frequency ? `, ${a.frequency}` : ''}${a.drinksPerWeek ? `, ${a.drinksPerWeek}/wk` : ''}`,
    );
  }
  if (payload.substance?.status) {
    lines.push(`Substance: ${payload.substance.status}${payload.substance.drugTypes?.length ? ` (${payload.substance.drugTypes.join(', ')})` : ''}`);
  }
  if (payload.exercise?.frequency || payload.exercise?.minutesPerWeek) {
    lines.push(
      `Exercise: ${[payload.exercise.frequency, payload.exercise.minutesPerWeek && `${payload.exercise.minutesPerWeek} min/wk`].filter(Boolean).join(', ')}`,
    );
  }
  if (payload.diet?.specialDiet || payload.diet?.notes) {
    lines.push(`Diet: ${payload.diet.specialDiet || payload.diet.notes}`);
  }
  if (payload.employment?.status || payload.employment?.occupation) {
    lines.push(
      `Employment: ${[payload.employment.status, payload.employment.occupation].filter(Boolean).join(' — ')}`,
    );
  }
  if (payload.living?.housingStatus || payload.living?.livesWith) {
    lines.push(
      `Living: ${[payload.living.housingStatus, payload.living.livesWith].filter(Boolean).join(', ')}`,
    );
  }
  if (payload.education?.level) lines.push(`Education: ${payload.education.level}`);
  if (payload.notes?.generalNotes) lines.push(payload.notes.generalNotes);
  return lines.join('\n');
}

export function formatFamilyHistory(records) {
  const lines = [];
  for (const r of records) {
    const p = r.payload || {};
    if (p.noKnownFamilyHistory) {
      lines.push('No known significant family history.');
      continue;
    }
    const entries = p.entries || (p.relationship ? [p] : []);
    for (const e of entries) {
      const rel = e.relationship === 'Other' ? e.otherRelationship || 'Other' : e.relationship;
      const bits = [rel, e.condition].filter(Boolean);
      if (e.status && e.status !== 'Unknown') bits.push(e.status);
      if (e.ageAtOnset) bits.push(`onset age ${e.ageAtOnset}`);
      if (e.vitalStatus === 'Deceased') {
        bits.push(`deceased${e.ageAtDeath ? ` at ${e.ageAtDeath}` : ''}`);
        if (e.causeOfDeath) bits.push(`COD: ${e.causeOfDeath}`);
      }
      if (bits.length) lines.push(bits.join(' — '));
    }
  }
  return lines.join('\n');
}

export function formatVitalsFromIntake(records) {
  return records.map((r) => {
    const p = r.payload || {};
    return {
      id: r.id,
      recordedAt: r.createdAt || p.recordedAt || null,
      bpSys: p.bpSys || '',
      bpDia: p.bpDia || '',
      pulse: p.pulse || '',
      temperature: p.temperature || '',
      o2: p.o2 || p.spo2 || '',
      respiratoryRate: p.respiratoryRate || '',
      bmi: p.bmi || '',
      weight: p.weight || '',
      height: p.height || '',
    };
  });
}

export function formatAllergiesFromBundle(allergies, noKnownDrugAllergies) {
  if (noKnownDrugAllergies && (!allergies || allergies.length === 0)) {
    return [{ id: 'nkda', allergen: 'NKDA', reaction: '—', severity: '—', onset: '—', timestamp: '—' }];
  }
  return (allergies || []).map((a) => ({
    id: a.id,
    allergen: a.allergenName || a.allergen || '—',
    reaction: a.reaction || '—',
    severity: a.severity || '—',
    onset: a.onset || (a.onsetDate ? String(a.onsetDate).slice(0, 10) : '—'),
    timestamp: a.updatedAt || a.createdAt
      ? new Date(a.updatedAt || a.createdAt).toLocaleString()
      : '—',
  }));
}

export function formatReferralsText(referrals) {
  return (referrals || [])
    .map((ref) => {
      const to = ref.toSpecialty || ref.toProviderName || ref.referralTypeName || 'Referral';
      const reason = ref.reason || ref.clinicalQuestion || '';
      const status = ref.status ? ` [${ref.status}]` : '';
      return reason ? `${to}: ${reason}${status}` : `${to}${status}`;
    })
    .filter(Boolean)
    .join('\n');
}

export function formatDiagnosesFromProblems(problems) {
  const asRows = (problems || []).map((p) => {
    const nested = p.problem || p;
    return {
      ...p,
      status: nested.status || p.status,
      icd10Code: nested.icd10Code || p.icd10Code || p.problemCode || '',
      diagnosisDescription:
        nested.diagnosisDescription ||
        p.diagnosisDescription ||
        p.problemDescription ||
        p.name ||
        '',
      addressedThisVisit: !!p.addressedThisVisit,
      isPrimary: !!p.isPrimary,
      priority: p.priority,
      assessment: p.assessment,
      plan: p.plan,
    };
  });

  const addressed = asRows.filter((p) => p.addressedThisVisit);
  const active = asRows.filter(
    (p) => !p.status || String(p.status).toLowerCase() === 'active',
  );
  const source = addressed.length ? addressed : active.length ? active : asRows;
  if (!source.length) return [{ code: '', description: '' }];

  const sorted = [...source].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return (a.priority ?? 999) - (b.priority ?? 999);
  });

  return sorted.map((p) => ({
    code: p.icd10Code || '',
    description: p.diagnosisDescription || '',
  }));
}

export function formatPlanFromEncounterProblems(problems) {
  const addressed = (problems || []).filter((p) => p.addressedThisVisit);
  if (!addressed.length) return '';
  return addressed
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return (a.priority ?? 999) - (b.priority ?? 999);
    })
    .map((p) => {
      const nested = p.problem || p;
      const label =
        nested.diagnosisDescription ||
        p.diagnosisDescription ||
        nested.icd10Code ||
        'Problem';
      const parts = [];
      if (p.assessment) parts.push(`Assessment: ${p.assessment}`);
      if (p.plan) parts.push(`Plan: ${p.plan}`);
      if (!parts.length) return null;
      return `${label}\n${parts.join('\n')}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Build a SOAP prefill snapshot from live encounter sources (intake, problems, referrals).
 */
export function buildSoapPrefillFromSources({
  bundle,
  problems = [],
  referrals = [],
  appointment,
  encounter,
  dermatology,
  gastroenterology,
}) {
  const records = bundle?.records || [];
  const ccRecord = latestBySection(records, INTAKE_SECTIONS.CHIEF_COMPLAINT_HPI);
  const rosRecord = latestBySection(records, INTAKE_SECTIONS.ROS);
  const socialRecord = latestBySection(records, INTAKE_SECTIONS.SOCIAL_HISTORY);
  const medRecs = allBySection(records, INTAKE_SECTIONS.MEDICATION_RECONCILIATION);
  const pmhRecs = allBySection(records, INTAKE_SECTIONS.MEDICATION_HISTORY);
  const surgicalRecs = allBySection(records, INTAKE_SECTIONS.SURGICAL_HISTORY);
  const familyRecs = allBySection(records, INTAKE_SECTIONS.FAMILY_HISTORY);
  const vitalsRecs = allBySection(records, INTAKE_SECTIONS.VITALS);

  const ccPayload = ccRecord?.payload || {};
  const chiefComplaint =
    ccPayload.chiefComplaintName ||
    ccPayload.reasonOfVisit ||
    encounter?.reason ||
    appointment?.visitReason ||
    '';

  const hpiFromStructured = ccPayload.hpi ? buildHpiNarrative(ccPayload.hpi) : '';
  const hpi = [hpiFromStructured, ccPayload.hpiNarrative, ccPayload.additionalNotes]
    .filter(Boolean)
    .join('\n\n');

  const planFromProblems = formatPlanFromEncounterProblems(problems);
  const dermSoap = formatDermatologyForSoap(dermatology);
  const giSoap = formatGastroenterologyForSoap(gastroenterology);
  const planText = [planFromProblems, dermSoap.plan, giSoap.plan]
    .filter(Boolean)
    .join('\n\n');
  const diagnoses = formatDiagnosesFromProblems(problems);
  if (dermatology?.plan?.primaryDiagnosisCode) {
    const code = dermatology.plan.primaryDiagnosisCode;
    if (!diagnoses.some((d) => d.code === code)) {
      diagnoses.unshift({
        code,
        description: dermatology.plan.primaryDiagnosis || '',
      });
    }
  }
  for (const c of dermatology?.plan?.icd10Codes || []) {
    if (c.code && !diagnoses.some((d) => d.code === c.code)) {
      diagnoses.push({ code: c.code, description: c.description || '' });
    }
  }
  if (gastroenterology?.plan?.primaryDiagnosisCode) {
    const code = gastroenterology.plan.primaryDiagnosisCode;
    if (!diagnoses.some((d) => d.code === code)) {
      diagnoses.unshift({
        code,
        description: gastroenterology.plan.primaryDiagnosis || '',
      });
    }
  }
  for (const c of gastroenterology?.plan?.icd10Codes || []) {
    if (c.code && !diagnoses.some((d) => d.code === c.code)) {
      diagnoses.push({ code: c.code, description: c.description || '' });
    }
  }

  const subjectiveHpi = [hpi, giSoap.subjective].filter(Boolean).join('\n\n');
  const physicalExam = [dermSoap.objective, giSoap.objective].filter(Boolean).join('\n\n') || undefined;

  return {
    header: {
      chiefComplaint,
    },
    subjective: {
      chiefComplaint,
      hpi: subjectiveHpi,
      ros: formatRosNarrative(rosRecord?.payload),
      currentMeds: formatCurrentMedications(medRecs),
      pmh: formatPastMedicalHistory(pmhRecs),
      pastSurgical: formatSurgicalHistory(surgicalRecs),
      socialHx: formatSocialHistory(socialRecord?.payload),
      familyHx: formatFamilyHistory(familyRecs),
    },
    allergies: formatAllergiesFromBundle(bundle?.allergies, bundle?.noKnownDrugAllergies),
    vitalsList: formatVitalsFromIntake(vitalsRecs),
    physicalExam,
    diagnoses,
    planText,
    referrals: formatReferralsText(referrals),
    screeningRecords: (records || [])
      .filter((r) => r.sectionType?.startsWith('screening_'))
      .reduce((acc, r) => {
        if (acc.some((x) => x.sectionType === r.sectionType)) return acc;
        return [
          ...acc,
          {
            ...r,
            label: SCREENING_LABELS[r.sectionType] || r.sectionType,
          },
        ];
      }, []),
    sourceMeta: {
      hasIntake: records.length > 0 || (bundle?.allergies || []).length > 0,
      sectionsPresent: [
        ccRecord && 'Chief complaint / HPI',
        rosRecord && 'ROS',
        medRecs.length && 'Medications',
        pmhRecs.length && 'Past medical history',
        surgicalRecs.length && 'Surgical history',
        socialRecord && 'Social history',
        familyRecs.length && 'Family history',
        vitalsRecs.length && 'Vitals',
        (bundle?.allergies || []).length && 'Allergies',
        referrals.length && 'Referrals',
        problems.length && 'Problems',
        planFromProblems && 'Visit A/P',
        dermSoap.objective && 'Dermatology exam',
        dermSoap.plan && 'Dermatology plan',
        giSoap.subjective && 'Gastroenterology symptoms',
        giSoap.objective && 'Gastroenterology findings',
        giSoap.plan && 'Gastroenterology plan',
      ].filter(Boolean),
    },
  };
}

export async function fetchSoapEncounterPrefill({ patientId, appointmentId, isSampleChart }) {
  const dermatology = loadDermatologyState(patientId, appointmentId);
  const gastroenterology = loadGastroenterologyState(patientId, appointmentId);

  if (!patientId || isSampleChart) {
    return buildSoapPrefillFromSources({
      bundle: {},
      problems: [],
      referrals: [],
      dermatology,
      gastroenterology,
    });
  }

  const [intakeRes, encounterProblemsRes, problemsRes, referralsRes] = await Promise.allSettled([
    intakeApi.getBundle(patientId, { encounterId: appointmentId }),
    appointmentId
      ? encounterProblemApi.list(patientId, appointmentId)
      : Promise.resolve({ data: { items: [] } }),
    patientProblemApi.getAll(patientId),
    referralApi.getAll(patientId, appointmentId ? { appointmentId } : {}),
  ]);

  const bundle =
    intakeRes.status === 'fulfilled'
      ? intakeRes.value?.data || { records: [], allergies: [], noKnownDrugAllergies: false }
      : { records: [], allergies: [], noKnownDrugAllergies: false };
  const encounterItems =
    encounterProblemsRes.status === 'fulfilled'
      ? encounterProblemsRes.value?.data?.items || []
      : [];
  const lifetimeProblems =
    problemsRes.status === 'fulfilled' ? problemsRes.value?.data || [] : [];
  const problems = encounterItems.length ? encounterItems : lifetimeProblems;
  const referrals = referralsRes.status === 'fulfilled' ? referralsRes.value?.data || [] : [];

  return buildSoapPrefillFromSources({
    bundle,
    problems,
    referrals,
    dermatology,
    gastroenterology,
  });
}
