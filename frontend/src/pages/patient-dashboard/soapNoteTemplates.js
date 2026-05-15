/**
 * SOAP note templates for patient dashboard.
 * `content` patches the SOAP form; omitted keys are left unchanged on merge.
 */

export const CUSTOM_TEMPLATES_STORAGE_KEY = 'hms_soap_custom_templates';

export const emptySubjective = () => ({
  chiefComplaint: '',
  hpi: '',
  ros: '',
  currentMeds: '',
  pmh: '',
  pastSurgical: '',
  socialHx: '',
  familyHx: '',
});

export const emptyMedicationRow = () => ({ name: '', dose: '', frequency: '', duration: '' });

/** Default built-in templates (clinical placeholders — not medical advice). */
export const BUILTIN_SOAP_TEMPLATES = [
  {
    id: 'general-follow-up',
    name: 'General follow-up',
    description: 'Routine return visit with balanced S/O/A/P scaffolding.',
    category: 'Primary care',
    content: {
      subjective: {
        chiefComplaint: 'Follow-up visit',
        hpi:
          'Patient returns for scheduled follow-up. Interval history reviewed. No new concerns reported since last visit unless discussed below.\n\n[Document interval symptoms, adherence, and response to prior plan.]',
        ros: 'Constitutional: denies fever, chills, unintentional weight loss.\nCardiovascular: denies chest pain, palpitations, edema.\nRespiratory: denies dyspnea, cough.\nGI: denies nausea, vomiting, diarrhea.\nGU: no dysuria, hematuria.\nNeuro: denies headache, focal weakness.\nMSK: denies joint swelling or limitation.\nSkin: no new rashes.',
        currentMeds: '[List current medications and any changes.]',
        pmh: '[Relevant chronic conditions.]',
        pastSurgical: '[Prior surgeries.]',
        socialHx: 'Tobacco: [ ]. Alcohol: [ ]. Occupation: [ ].',
        familyHx: '[Pertinent family history.]',
      },
      physicalExam:
        'General: well appearing, comfortable, NAD.\nVitals reviewed.\nHEENT: [ ].\nNeck: [ ].\nCardiovascular: regular rate and rhythm, no murmur appreciated.\nLungs: clear to auscultation bilaterally.\nAbdomen: soft, non-tender, non-distended.\nExtremities: no edema.\nNeuro: alert and oriented, grossly non-focal.\nSkin: [ ].',
      diagnosticTestingResults: '[Labs or imaging reviewed today, if any.]',
      diagnoses: [{ code: '', description: 'Encounter for follow-up examination' }],
      differential: 'N/A — established follow-up.',
      clinicalImpression: 'Stable on current regimen; continue monitoring per problem list.',
      planText:
        '1) Continue current management as tolerated.\n2) [Add labs, medication changes, or referrals as indicated.]\n3) Return precautions discussed.',
      medications: [emptyMedicationRow()],
      followUp: 'Routine follow-up in [ ] weeks/months, or sooner if symptoms worsen.',
      patientEducation: 'Discussed diagnosis, medications, and when to seek urgent care.',
      referrals: '',
    },
  },
  {
    id: 'uri-outpatient',
    name: 'Upper respiratory symptoms',
    description: 'Cough, congestion, sore throat — outpatient framing.',
    category: 'Primary care',
    content: {
      subjective: {
        chiefComplaint: 'Upper respiratory symptoms',
        hpi:
          'Onset approximately [ ] days ago with nasal congestion, rhinorrhea, and sore throat. Cough [dry/productive]. Fever [yes/no], max temp [ ]. Sick contacts [ ]. COVID/flu testing [ ]. Prior similar episodes [ ].',
        ros: 'ENT: sore throat, congestion, voice changes as above.\nPulmonary: cough as above; denies hemoptysis.\nConstitutional: [fever/chills/fatigue].\nGI/Neuro: otherwise negative unless stated.',
        currentMeds: '[OTC and prescribed meds for symptom relief.]',
        pmh: '[Asthma/COPD, immunocompromise if relevant.]',
        pastSurgical: '',
        socialHx: 'Tobacco: [ ]. Living situation / work: [ ].',
        familyHx: '',
      },
      physicalExam:
        'General: comfortable, [febrile afebrile].\nHEENT: nasal mucosa [ ], oropharynx [ ], TM [ ], lymphadenopathy [ ].\nNeck: supple, [thyroid].\nLungs: clear / [findings].\nCardiovascular: RRR.\nOther systems: unremarkable unless documented.',
      diagnosticTestingResults: 'Rapid strep / COVID / flu: [ ]. CXR: [ if performed ].',
      diagnoses: [
        { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
        { code: '', description: 'Acute pharyngitis — if applicable' },
      ],
      differential: 'Allergic rhinitis; influenza; COVID-19; streptococcal pharyngitis; sinusitis.',
      clinicalImpression: 'Likely viral URI; supportive care unless focal bacterial findings.',
      planText:
        '- Supportive care: hydration, rest, analgesics/antipyretics PRN per protocol.\n- Discussed red flags: worsening dyspnea, persistent high fever, inability to tolerate fluids, confusion.\n- Return or urgent evaluation if red flags.',
      medications: [
        { name: 'Acetaminophen', dose: '500 mg', frequency: 'PRN', duration: 'per symptom relief' },
        emptyMedicationRow(),
      ],
      followUp: 'PRN if worsening; routine follow-up if symptoms persist beyond expected course.',
      patientEducation: 'Viral illness expected course; hygiene and return precautions.',
      referrals: '',
    },
  },
  {
    id: 'htn-follow-up',
    name: 'Hypertension follow-up',
    description: 'Blood pressure chronic disease management visit.',
    category: 'Cardiovascular',
    content: {
      subjective: {
        chiefComplaint: 'Blood pressure follow-up',
        hpi:
          'Home BP log reviewed: average approx [ ] / [ ] mmHg on [ ] readings. Medication adherence [ ]. Side effects [ ]. Dietary sodium / exercise [ ].',
        ros: 'Cardiovascular: denies chest pain, syncope, PND, orthopnea.\nNeuro: denies severe headache, vision changes.\nRenal: no edema reported.\nOtherwise negative unless stated.',
        currentMeds: '[Antihypertensives with doses.]',
        pmh: 'Hypertension [other CV risk factors].',
        pastSurgical: '',
        socialHx: 'Diet, activity, tobacco use as discussed.',
        familyHx: 'CV disease in family: [ ].',
      },
      physicalExam:
        'BP [ ] / [ ] mmHg [arm, position].\nHR [ ]. BMI [ ].\nCardiovascular: RRR, no murmur.\nLungs: clear.\nExtremities: [edema none].\nFundoscopic / vascular exam: [ if performed ].',
      diagnosticTestingResults: 'Recent labs: BMP, lipids, A1c as applicable — [values or pending].',
      diagnoses: [{ code: 'I10', description: 'Essential (primary) hypertension' }],
      differential: 'Secondary hypertension less likely without suggestive features; [if considered].',
      clinicalImpression: 'Hypertension [controlled / not at goal]; continue optimization.',
      planText:
        '1) Lifestyle counseling reinforced.\n2) Medication adjustment: [ ].\n3) Home BP monitoring: [frequency / technique].\n4) Labs / follow-up interval: [ ].',
      medications: [emptyMedicationRow()],
      followUp: '[ ] weeks for BP recheck and lab review.',
      patientEducation: 'BP goals, sodium, activity, medication timing and side effects.',
      referrals: '',
    },
  },
  {
    id: 'annual-wellness',
    name: 'Annual wellness / preventive',
    description: 'Preventive visit structure with screening placeholders.',
    category: 'Preventive',
    content: {
      subjective: {
        chiefComplaint: 'Annual wellness visit',
        hpi:
          'Preventive visit. Interval cancer screening status: [ ]. Immunizations up to date: [ ]. Safety: seat belts, falls, home safety [ ]. Mood / stress / sleep [ ].',
        ros: 'Reviewed preventive ROS; pertinent positives/negatives per intake.',
        currentMeds: '[Complete medication list with adherence.]',
        pmh: '[Chronic conditions.]',
        pastSurgical: '',
        socialHx: 'Tobacco / alcohol / other substances: [ ]. Exercise: [ ].',
        familyHx: 'Age-appropriate cancer and CV family history reviewed.',
      },
      physicalExam:
        'Complete physical exam per age and risk factors. Notable findings: [ ].',
      diagnosticTestingResults: 'Screening labs/imaging: [ordered or reviewed].',
      diagnoses: [{ code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings' }],
      differential: 'N/A — preventive encounter.',
      clinicalImpression: 'Preventive health maintenance; age-appropriate screening discussed.',
      planText:
        '- Immunizations: [ ].\n- Cancer screening: [ ].\n- Cardiovascular risk: [ ].\n- Other preventive topics: [ ].',
      medications: [emptyMedicationRow()],
      followUp: 'Annual exam or sooner for chronic disease follow-up as listed.',
      patientEducation: 'Shared decision-making on screening and lifestyle.',
      referrals: '',
    },
  },
  {
    id: 'soap-shell',
    name: 'SOAP blank structure',
    description: 'Minimal headings only — fastest start for free-text documentation.',
    category: 'Utility',
    content: {
      subjective: {
        chiefComplaint: '',
        hpi: '[HPI]\n\nOnset:\nDuration:\nSeverity:\nAssociated symptoms:\nPrior treatment:',
        ros: '[Pertinent ROS by system]',
        currentMeds: '',
        pmh: '',
        pastSurgical: '',
        socialHx: '',
        familyHx: '',
      },
      physicalExam: '[General]\n[HEENT]\n[CV]\n[Pulm]\n[Abd]\n[Ext]\n[Neuro]\n[Skin]',
      diagnosticTestingResults: '',
      diagnoses: [{ code: '', description: '' }],
      differential: '',
      clinicalImpression: '',
      planText: '1)\n2)\n3)',
      medications: [emptyMedicationRow()],
      followUp: '',
      patientEducation: '',
      referrals: '',
    },
  },
];

export function loadCustomTemplates() {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplates(list) {
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/**
 * Apply template content to form setters (merge subjective; replace string/array fields when provided).
 */
export function applySoapTemplateContent(content, setters) {
  const {
    setHeader,
    setSubjective,
    setPhysicalExam,
    setDiagnosticTestingResults,
    setDiagnoses,
    setDifferential,
    setClinicalImpression,
    setPlanText,
    setMedications,
    setFollowUp,
    setPatientEducation,
    setReferrals,
  } = setters;

  if (content.headerChiefComplaint != null) {
    setHeader((h) => ({ ...h, chiefComplaint: content.headerChiefComplaint }));
  }

  if (content.subjective && typeof content.subjective === 'object') {
    setSubjective((s) => ({ ...s, ...content.subjective }));
  }
  if (content.physicalExam != null) setPhysicalExam(content.physicalExam);
  if (content.diagnosticTestingResults != null) setDiagnosticTestingResults(content.diagnosticTestingResults);
  if (content.diagnoses != null) setDiagnoses(content.diagnoses.length ? content.diagnoses : [{ code: '', description: '' }]);
  if (content.differential != null) setDifferential(content.differential);
  if (content.clinicalImpression != null) setClinicalImpression(content.clinicalImpression);
  if (content.planText != null) setPlanText(content.planText);
  if (content.medications != null) setMedications(content.medications.length ? content.medications : [emptyMedicationRow()]);
  if (content.followUp != null) setFollowUp(content.followUp);
  if (content.patientEducation != null) setPatientEducation(content.patientEducation);
  if (content.referrals != null) setReferrals(content.referrals);
}
