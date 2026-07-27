import {
  SIG_DURATIONS,
  SIG_FREQUENCIES,
  SIG_ROUTES,
  SIG_UNITS,
} from './medicationConstants';

export const EMPTY_SIG = {
  dose: '',
  unit: 'mg',
  route: 'By Mouth (PO)',
  frequency: 'Once daily (QD)',
  duration: '30 days',
  prn: false,
};

const ROUTE_MAP = {
  oral: 'By Mouth (PO)',
  po: 'By Mouth (PO)',
  sublingual: 'Sublingual (SL)',
  topical: 'Topical',
  intravenous: 'Intravenous (IV)',
  iv: 'Intravenous (IV)',
  intramuscular: 'Intramuscular (IM)',
  im: 'Intramuscular (IM)',
  subcutaneous: 'Subcutaneous (SC)',
  sc: 'Subcutaneous (SC)',
  inhalation: 'Inhalation',
};

const FREQUENCY_MAP = {
  'once daily': 'Once daily (QD)',
  'twice daily': 'Twice daily (BID)',
  'three times daily': 'Three times daily (TID)',
  'four times daily': 'Four times daily (QID)',
  'every 6 hours': 'Every 6 hours (Q6H)',
  'every 8 hours': 'Every 8 hours (Q8H)',
  'as needed': 'As needed (PRN)',
};

export function mapFormularyToCatalogItem(med) {
  const strengthLabel = [med.strength, med.strengthUnit].filter(Boolean).join(' ').trim();
  const baseName = med.name || med.genericName || med.brandName || 'Medication';
  const name =
    strengthLabel && !String(baseName).toLowerCase().includes(String(med.strength || '').toLowerCase())
      ? `${baseName} ${strengthLabel}`
      : baseName;
  return {
    ...med,
    id: med.id,
    name,
    code: med.code || med.ndc || med.rxNorm || med.id,
    strength: strengthLabel || med.strength || '',
    dosageForm: med.dosageForm || '',
    medicationClass: med.therapeuticCategory || med.medicationClass || '',
    formularyTier: med.formularyStatus || med.formularyTier || '',
    ndcSafetyFlag: med.ndcSafetyFlag || (med.ndc ? 'Verified' : ''),
  };
}

export function pickSigFromFormulary(med) {
  const doseValue = med.defaultDose || String(med.strength || '').replace(/[^\d.]/g, '') || '';
  const unitCandidate = med.defaultDoseUnit || med.strengthUnit || '';
  const unit =
    SIG_UNITS.find((u) => u.toLowerCase() === String(unitCandidate).toLowerCase()) ||
    EMPTY_SIG.unit;

  const routeRaw = Array.isArray(med.route) ? med.route[0] : med.route;
  const routeMapped = ROUTE_MAP[String(routeRaw || '').toLowerCase()];
  const route =
    SIG_ROUTES.find((r) => r === routeMapped) ||
    SIG_ROUTES.find((r) => r.toLowerCase().includes(String(routeRaw || '').toLowerCase())) ||
    EMPTY_SIG.route;

  const freqMapped = FREQUENCY_MAP[String(med.defaultFrequency || '').toLowerCase()];
  const frequency =
    SIG_FREQUENCIES.find((f) => f === freqMapped) ||
    SIG_FREQUENCIES.find((f) =>
      f.toLowerCase().includes(String(med.defaultFrequency || '').toLowerCase()),
    ) ||
    EMPTY_SIG.frequency;

  let duration = EMPTY_SIG.duration;
  if (med.defaultDuration != null && med.durationUnit) {
    const built = `${med.defaultDuration} ${String(med.durationUnit).toLowerCase()}`;
    duration =
      SIG_DURATIONS.find((d) => d.toLowerCase() === built.toLowerCase()) ||
      SIG_DURATIONS.find((d) => d.startsWith(String(med.defaultDuration))) ||
      EMPTY_SIG.duration;
  }

  return {
    ...EMPTY_SIG,
    dose: doseValue,
    unit,
    route,
    frequency,
    duration,
    prn: String(med.defaultFrequency || '').toLowerCase().includes('as needed'),
  };
}

export function procedureToMedication(procedure) {
  if (!procedure) return null;
  return mapFormularyToCatalogItem({
    id: procedure.id,
    name: procedure.name,
    code: procedure.code,
    strength: procedure.strength,
    strengthUnit: procedure.strengthUnit,
    dosageForm: procedure.dosageForm,
    route: procedure.route,
    genericName: procedure.genericName,
    brandName: procedure.brandName,
    medicationClass: procedure.medicationClass,
    therapeuticCategory: procedure.therapeuticCategory,
    formularyStatus: procedure.formularyStatus,
    formularyTier: procedure.formularyTier,
    preferredDrug: procedure.preferredDrug,
    ndcSafetyFlag: procedure.ndcSafetyFlag,
    defaultDose: procedure.defaultDose,
    defaultDoseUnit: procedure.defaultDoseUnit,
    defaultFrequency: procedure.defaultFrequency,
    defaultDuration: procedure.defaultDuration,
    durationUnit: procedure.durationUnit,
    instructions: procedure.instructions,
    ndc: procedure.ndc,
    rxNorm: procedure.rxNorm,
  });
}
