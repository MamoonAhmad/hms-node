const ALLERGY_CONFLICTS = [
  { allergen: 'sulfa', keywords: ['hydrochlorothiazide', 'hctz', 'sulfonamide'] },
  { allergen: 'folic acid', keywords: ['folic', 'folate'] },
  { allergen: 'cat', keywords: ['feline', 'cat'] },
];

const DRUG_INTERACTIONS = [
  { drugs: ['lisinopril', 'losartan'], message: 'ACE inhibitor and ARB combination may increase hyperkalemia risk' },
  { drugs: ['metoprolol', 'carvedilol'], message: 'Multiple beta blockers may cause bradycardia' },
];

const DUPLICATE_CLASSES = ['Beta Blocker', 'ACE Inhibitor', 'ARB', 'Statin'];

function normalize(value) {
  return String(value || '').toLowerCase();
}

export function buildSigPreview({ dose, unit, route, frequency, duration, prn }) {
  if (!dose || !unit || !route || !frequency || !duration) return '';
  const routeText = route.replace(/^By Mouth \(PO\)$/i, 'by mouth');
  let text = `Take ${dose} ${unit} ${routeText.toLowerCase()} ${frequency.toLowerCase()} for ${duration}`;
  if (prn) text += ' as needed';
  return text.replace(/\s+/g, ' ').trim();
}

export function runSafetyChecks({
  medication,
  allergies = [],
  activeProblems = [],
  currentMedications = [],
  existingOrders = [],
  patientAge,
  patientWeightKg,
  sig,
}) {
  const alerts = [];
  const medName = normalize(medication?.name || medication?.medicationName);
  const medClass = medication?.medicationClass;

  for (const allergy of allergies) {
    const allergen = normalize(allergy.allergenName || allergy.name);
    for (const rule of ALLERGY_CONFLICTS) {
      if (allergen.includes(rule.allergen) || rule.allergen.includes(allergen)) {
        if (rule.keywords.some((kw) => medName.includes(kw))) {
          alerts.push({
            type: 'allergy_conflict',
            severity: 'Critical',
            message: `Allergy conflict: patient is allergic to ${allergy.allergenName || allergy.name}`,
          });
        }
      }
    }
    if (allergen && medName.includes(allergen.split('/')[0])) {
      alerts.push({
        type: 'allergy_conflict',
        severity: 'Critical',
        message: `Allergy conflict: patient is allergic to ${allergy.allergenName || allergy.name}`,
      });
    }
  }

  for (const interaction of DRUG_INTERACTIONS) {
    const currentMeds = [
      ...currentMedications.map((m) => normalize(m.name || m.medicationName)),
      ...existingOrders.map((o) => normalize(o.medicationName)),
    ];
    const allDrugs = [medName, ...currentMeds];
    if (interaction.drugs.every((d) => allDrugs.some((m) => m.includes(d)))) {
      alerts.push({
        type: 'drug_drug_interaction',
        severity: 'Warning',
        message: interaction.message,
      });
    }
  }

  if (medClass && DUPLICATE_CLASSES.includes(medClass)) {
    const duplicate = [...existingOrders, ...currentMedications].find(
      (item) => item.medicationClass === medClass || normalize(item.name).includes(normalize(medClass)),
    );
    if (duplicate) {
      alerts.push({
        type: 'duplicate_therapy',
        severity: 'Warning',
        message: `Duplicate therapy: patient already has an active ${medClass} medication`,
      });
    }
  }

  const doseNum = Number(sig?.dose);
  if (doseNum > 100 && normalize(sig?.unit) === 'mg') {
    alerts.push({
      type: 'dose_range_issue',
      severity: 'Warning',
      message: 'Dose may exceed typical range — verify dose before proceeding',
    });
  }

  if (patientAge != null && patientAge < 18 && medName.includes('atorvastatin')) {
    alerts.push({
      type: 'patient_age_warning',
      severity: 'Info',
      message: 'Statin use in pediatric patients requires specialist review',
    });
  }

  if (patientWeightKg != null && patientWeightKg < 50 && doseNum >= 50) {
    alerts.push({
      type: 'weight_based_dose_warning',
      severity: 'Warning',
      message: 'Weight-based dose review recommended for this patient weight',
    });
  }

  for (const problem of activeProblems) {
    const desc = normalize(problem.diagnosisDescription || problem.name);
    if (desc.includes('diabetes') && medName.includes('metformin') && desc.includes('renal')) {
      alerts.push({
        type: 'active_problem_warning',
        severity: 'Warning',
        message: 'Active renal condition may affect medication selection',
      });
    }
  }

  for (const current of currentMedications) {
    const currentName = normalize(current.name || current.medicationName);
    if (currentName && medName && currentName === medName) {
      alerts.push({
        type: 'current_medication_conflict',
        severity: 'Warning',
        message: `Patient is already taking ${current.name || current.medicationName}`,
      });
    }
  }

  return alerts;
}

export function getCdsAlerts({ patientAge, activeProblems = [] }) {
  const alerts = [];
  if (patientAge != null && patientAge >= 40) {
    alerts.push({
      severity: 'Info',
      message: 'Annual cardiovascular risk screening due for age ≥ 40',
    });
  }
  const hasDiabetes = activeProblems.some((p) =>
    normalize(p.diagnosisDescription).includes('diabetes'),
  );
  if (hasDiabetes) {
    alerts.push({
      severity: 'Warning',
      message: 'Diabetes mellitus — consider A1c monitoring if not done in last 3 months',
    });
  }
  return alerts;
}

export function hasBlockingSafetyAlerts(alerts) {
  return alerts.some((a) => a.severity === 'Critical' || a.severity === 'Warning');
}
