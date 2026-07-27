export const NEPHROLOGY_SECTIONS = [
  { id: 'ckd-egfr-proteinuria', label: 'CKD / eGFR / Proteinuria' },
  { id: 'volume-dialysis-transplant', label: 'Volume / Dialysis / Transplant' },
  { id: 'nephrotoxic-med-review', label: 'Nephrotoxic Med Review' },
];

export const YES_NO_OPTIONS = ['Yes', 'No'];

export const YES_NO_UNKNOWN_OPTIONS = ['Yes', 'No', 'Unknown'];

export const VISIT_TYPE_OPTIONS = [
  'New consult',
  'Follow-up',
  'CKD management',
  'Dialysis visit',
  'Transplant follow-up',
  'Post-hospitalization',
  'Urgent / acute kidney injury',
];

export const CKD_STAGE_OPTIONS = [
  'G1 (eGFR ≥ 90)',
  'G2 (eGFR 60–89)',
  'G3a (eGFR 45–59)',
  'G3b (eGFR 30–44)',
  'G4 (eGFR 15–29)',
  'G5 (eGFR < 15)',
  'Not staged / unknown',
];

export const CKD_CAUSE_OPTIONS = [
  'Diabetic kidney disease',
  'Hypertensive nephrosclerosis',
  'Glomerulonephritis',
  'Polycystic kidney disease',
  'Obstructive / reflux nephropathy',
  'Cardiorenal',
  'AKI with incomplete recovery',
  'Other / multifactorial',
  'Unknown',
];

export const EGFR_METHOD_OPTIONS = [
  'CKD-EPI (creatinine)',
  'CKD-EPI (cystatin C)',
  'CKD-EPI (combined)',
  'MDRD',
  'Measured / other',
  'Unknown',
];

export const PROTEINURIA_METHOD_OPTIONS = [
  'Urine ACR (mg/g)',
  'Urine PCR (mg/g)',
  '24-hour urine protein (g/day)',
  'Dipstick only',
  'Not measured',
];

export const A_STAGE_OPTIONS = [
  'A1 (ACR < 30)',
  'A2 (ACR 30–300)',
  'A3 (ACR > 300)',
  'Not assessed',
];

export const TREND_OPTIONS = ['Improving', 'Stable', 'Worsening', 'Insufficient data'];

export const FOLLOW_UP_INTERVAL_OPTIONS = [
  '1–2 weeks',
  '1 month',
  '3 months',
  '6 months',
  '12 months',
  'PRN / as needed',
];

export const VOLUME_STATUS_OPTIONS = [
  'Euvolemic',
  'Mild volume overload',
  'Moderate volume overload',
  'Severe volume overload / anasarca',
  'Hypovolemic / dry',
  'Uncertain',
];

export const EDEMA_OPTIONS = [
  'None',
  'Trace LE',
  '1+ LE',
  '2+ LE',
  '3–4+ LE',
  'Sacral / anasarca',
  'Pulmonary congestion',
];

export const DIALYSIS_MODALITY_OPTIONS = [
  'Not on dialysis',
  'In-center HD',
  'Home HD',
  'PD (CAPD)',
  'PD (APD / CCPD)',
  'CRRT (inpatient)',
  'Planned / access pending',
];

export const DIALYSIS_ACCESS_OPTIONS = [
  'AV fistula',
  'AV graft',
  'Tunneled CVC',
  'Temporary CVC',
  'PD catheter',
  'N/A',
];

export const TRANSPLANT_STATUS_OPTIONS = [
  'Not applicable',
  'Not evaluated',
  'Evaluation in progress',
  'Active waitlist',
  'Inactive / hold on waitlist',
  'Living donor candidate',
  'Post-transplant',
  'Failed transplant / back on dialysis',
];

export const BP_CONTROL_OPTIONS = [
  'At goal',
  'Above goal',
  'Below goal / symptomatic',
  'Not assessed',
];

export const NEPHROTOXIC_MED_CATEGORIES = [
  { id: 'nsaids', label: 'NSAIDs / COX-2 inhibitors' },
  { id: 'aceArb', label: 'ACE inhibitor / ARB / ARNI' },
  { id: 'diuretics', label: 'Diuretics (loop / thiazide / K-sparing)' },
  { id: 'aminoglycosides', label: 'Aminoglycosides' },
  { id: 'vancomycin', label: 'Vancomycin / other nephrotoxic abx' },
  { id: 'contrast', label: 'Recent iodinated contrast' },
  { id: 'calcineurin', label: 'Calcineurin inhibitors (tacrolimus / cyclosporine)' },
  { id: 'lithium', label: 'Lithium' },
  { id: 'sglt2', label: 'SGLT2 inhibitor' },
  { id: 'other', label: 'Other nephrotoxic / high-risk agent' },
];

export const MED_ACTION_OPTIONS = [
  'Continue',
  'Hold',
  'Dose adjust',
  'Discontinue',
  'Substitute alternative',
  'Monitor labs / levels',
  'Not applicable',
];

export const NEPHROTOXIC_PLAN_OPTIONS = [
  'Hold NSAIDs',
  'Sick-day guidance (hold ACE/ARB/diuretic/SGLT2)',
  'Renal dose adjustment reviewed',
  'Contrast risk counseling',
  'Drug level monitoring ordered',
  'Pharmacy consult',
  'Patient education completed',
  'Reconcile with home med list',
];

/** Rough eGFR staging helper (mL/min/1.73m²). */
export function ckdStageFromEgfr(egfr) {
  const n = Number(egfr);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 90) return { stage: 'G1', tone: 'success', label: 'G1 (eGFR ≥ 90)' };
  if (n >= 60) return { stage: 'G2', tone: 'success', label: 'G2 (eGFR 60–89)' };
  if (n >= 45) return { stage: 'G3a', tone: 'warning', label: 'G3a (eGFR 45–59)' };
  if (n >= 30) return { stage: 'G3b', tone: 'warning', label: 'G3b (eGFR 30–44)' };
  if (n >= 15) return { stage: 'G4', tone: 'danger', label: 'G4 (eGFR 15–29)' };
  return { stage: 'G5', tone: 'danger', label: 'G5 (eGFR < 15)' };
}

export function proteinuriaBandFromAcr(acr) {
  const n = Number(acr);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n < 30) return { stage: 'A1', tone: 'success', label: 'A1 (ACR < 30)' };
  if (n <= 300) return { stage: 'A2', tone: 'warning', label: 'A2 (ACR 30–300)' };
  return { stage: 'A3', tone: 'danger', label: 'A3 (ACR > 300)' };
}
