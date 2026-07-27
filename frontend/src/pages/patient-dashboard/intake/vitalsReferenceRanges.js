/**
 * Age-banded vital sign entry limits and typical normal ranges.
 * Entry limits are absolute allowable values; normal ranges are clinical guidance shown in the UI.
 */

import { calculateAge } from './intakeConstants';

export const PEDIATRIC_AGE_CUTOFF = 10;

/** Age bands used for pediatric vs adult vital ranges. */
export function getAgeBand(dateOfBirth) {
  const ageYears = calculateAge(dateOfBirth);
  if (ageYears === null) return { key: 'adult', label: 'Adult', ageYears: null, ageMonths: null };

  const birth = new Date(dateOfBirth);
  const today = new Date();
  const ageMonths =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth()) -
    (today.getDate() < birth.getDate() ? 1 : 0);

  if (ageMonths < 1) return { key: 'neonate', label: 'Neonate (< 1 mo)', ageYears, ageMonths };
  if (ageMonths < 12) return { key: 'infant', label: 'Infant (1–12 mo)', ageYears, ageMonths };
  if (ageYears < 3) return { key: 'toddler', label: 'Toddler (1–3 yrs)', ageYears, ageMonths };
  if (ageYears < 6) return { key: 'preschool', label: 'Preschool (3–5 yrs)', ageYears, ageMonths };
  if (ageYears < 10) return { key: 'school', label: 'School age (6–9 yrs)', ageYears, ageMonths };
  if (ageYears < 18) return { key: 'adolescent', label: 'Adolescent (10–17 yrs)', ageYears, ageMonths };
  return { key: 'adult', label: 'Adult', ageYears, ageMonths };
}

export function isPediatricPatient(patient) {
  const age = calculateAge(patient?.dateOfBirth);
  return age !== null && age < PEDIATRIC_AGE_CUTOFF;
}

/**
 * @returns {{
 *   band: ReturnType<typeof getAgeBand>,
 *   bpSys: { min: number, max: number, normalMin: number, normalMax: number, unit: string, required: boolean },
 *   bpDia: ...,
 *   pulse: ...,
 *   respiratoryRate: ...,
 *   temperature: ...,
 *   glucose: ...,
 *   o2: ...,
 *   weight: ...,
 *   heightFeet: ...,
 *   heightInches: ...,
 *   painLevel: ...,
 * }}
 */
export function getVitalRanges(dateOfBirth) {
  const band = getAgeBand(dateOfBirth);
  const peds = band.key !== 'adult' && band.key !== 'adolescent';

  // Shared clinical entry ceilings (absolute / equipment extremes)
  const temperature = {
    min: 95,
    max: 108,
    normalMin: 97.0,
    normalMax: 99.5,
    unit: '°F',
    required: true,
    feverAt: 100.4,
  };
  const glucose = {
    min: 40,
    max: 600,
    normalMin: 70,
    normalMax: 140,
    unit: 'mg/dL',
    required: false,
    note: 'Random / POC; fasting normal ~70–99 mg/dL',
  };
  const o2 = {
    min: 70,
    max: 100,
    normalMin: 95,
    normalMax: 100,
    unit: '%',
    required: peds,
  };
  const painLevel = { min: 1, max: 10, unit: '', required: false };

  const byBand = {
    neonate: {
      bpSys: { min: 45, max: 110, normalMin: 60, normalMax: 90, unit: 'mmHg', required: true },
      bpDia: { min: 20, max: 75, normalMin: 30, normalMax: 60, unit: 'mmHg', required: true },
      pulse: { min: 80, max: 220, normalMin: 100, normalMax: 205, unit: 'BPM', required: true },
      respiratoryRate: { min: 20, max: 80, normalMin: 30, normalMax: 60, unit: 'breaths/min', required: true },
      weight: { min: 1, max: 20, normalMin: 5, normalMax: 12, unit: 'lbs', required: true },
      heightFeet: { min: 0, max: 2, unit: 'ft', required: true },
      heightInches: { min: 0, max: 11.9, unit: 'in', required: false },
    },
    infant: {
      bpSys: { min: 50, max: 120, normalMin: 70, normalMax: 100, unit: 'mmHg', required: true },
      bpDia: { min: 25, max: 80, normalMin: 35, normalMax: 65, unit: 'mmHg', required: true },
      pulse: { min: 80, max: 200, normalMin: 100, normalMax: 180, unit: 'BPM', required: true },
      respiratoryRate: { min: 18, max: 70, normalMin: 30, normalMax: 53, unit: 'breaths/min', required: true },
      weight: { min: 5, max: 35, normalMin: 10, normalMax: 26, unit: 'lbs', required: true },
      heightFeet: { min: 0, max: 3, unit: 'ft', required: true },
      heightInches: { min: 0, max: 11.9, unit: 'in', required: false },
    },
    toddler: {
      bpSys: { min: 60, max: 130, normalMin: 80, normalMax: 110, unit: 'mmHg', required: true },
      bpDia: { min: 30, max: 90, normalMin: 40, normalMax: 70, unit: 'mmHg', required: true },
      pulse: { min: 70, max: 180, normalMin: 80, normalMax: 140, unit: 'BPM', required: true },
      respiratoryRate: { min: 14, max: 50, normalMin: 22, normalMax: 37, unit: 'breaths/min', required: true },
      weight: { min: 15, max: 60, normalMin: 20, normalMax: 40, unit: 'lbs', required: true },
      heightFeet: { min: 1, max: 4, unit: 'ft', required: true },
      heightInches: { min: 0, max: 11.9, unit: 'in', required: false },
    },
    preschool: {
      bpSys: { min: 65, max: 140, normalMin: 85, normalMax: 115, unit: 'mmHg', required: true },
      bpDia: { min: 35, max: 95, normalMin: 45, normalMax: 75, unit: 'mmHg', required: true },
      pulse: { min: 65, max: 160, normalMin: 80, normalMax: 120, unit: 'BPM', required: true },
      respiratoryRate: { min: 12, max: 45, normalMin: 20, normalMax: 28, unit: 'breaths/min', required: true },
      weight: { min: 20, max: 80, normalMin: 28, normalMax: 55, unit: 'lbs', required: true },
      heightFeet: { min: 2, max: 5, unit: 'ft', required: true },
      heightInches: { min: 0, max: 11.9, unit: 'in', required: false },
    },
    school: {
      bpSys: { min: 70, max: 150, normalMin: 90, normalMax: 120, unit: 'mmHg', required: true },
      bpDia: { min: 40, max: 100, normalMin: 50, normalMax: 80, unit: 'mmHg', required: true },
      pulse: { min: 55, max: 150, normalMin: 75, normalMax: 118, unit: 'BPM', required: true },
      respiratoryRate: { min: 10, max: 40, normalMin: 18, normalMax: 25, unit: 'breaths/min', required: true },
      weight: { min: 30, max: 150, normalMin: 40, normalMax: 90, unit: 'lbs', required: true },
      heightFeet: { min: 2, max: 5, unit: 'ft', required: true },
      heightInches: { min: 0, max: 11.9, unit: 'in', required: false },
    },
    adolescent: {
      bpSys: { min: 80, max: 190, normalMin: 90, normalMax: 130, unit: 'mmHg', required: true },
      bpDia: { min: 40, max: 120, normalMin: 55, normalMax: 85, unit: 'mmHg', required: true },
      pulse: { min: 45, max: 160, normalMin: 60, normalMax: 100, unit: 'BPM', required: true },
      respiratoryRate: { min: 8, max: 40, normalMin: 12, normalMax: 20, unit: 'breaths/min', required: true },
      weight: { min: 50, max: 400, normalMin: 80, normalMax: 200, unit: 'lbs', required: false },
      heightFeet: { min: 3, max: 7, unit: 'ft', required: false },
      heightInches: { min: 0, max: 11.9, unit: 'in', required: false },
    },
    adult: {
      bpSys: { min: 60, max: 250, normalMin: 90, normalMax: 120, unit: 'mmHg', required: true },
      bpDia: { min: 40, max: 150, normalMin: 60, normalMax: 80, unit: 'mmHg', required: true },
      pulse: { min: 40, max: 200, normalMin: 60, normalMax: 100, unit: 'BPM', required: true },
      respiratoryRate: { min: 8, max: 40, normalMin: 12, normalMax: 20, unit: 'breaths/min', required: true },
      weight: { min: 50, max: 700, normalMin: 90, normalMax: 250, unit: 'lbs', required: false },
      heightFeet: { min: 3, max: 8, unit: 'ft', required: false },
      heightInches: { min: 0, max: 11.9, unit: 'in', required: false },
    },
  };

  const core = byBand[band.key] || byBand.adult;
  return {
    band,
    ...core,
    temperature,
    glucose,
    o2,
    painLevel,
  };
}

function parseNum(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function checkRange(label, value, range, { allowEmpty = !range.required } = {}) {
  if (value === null || value === '') {
    if (!allowEmpty && range.required) return `${label} is required`;
    return null;
  }
  if (Number.isNaN(value)) return `${label} must be a number`;
  if (value < range.min || value > range.max) {
    return `${label} must be between ${range.min} and ${range.max}${range.unit ? ` ${range.unit}` : ''}`;
  }
  return null;
}

/**
 * Validate vitals payload against age-appropriate entry limits.
 * @returns {string[]} error messages
 */
export function validateVitalsData(data, patient) {
  const ranges = getVitalRanges(patient?.dateOfBirth);
  const errors = [];
  const push = (msg) => {
    if (msg) errors.push(msg);
  };

  const sys = parseNum(data.bpSys);
  const dia = parseNum(data.bpDia);

  if (ranges.bpSys.required && (data.bpSys === '' || data.bpSys == null)) {
    errors.push('Systolic blood pressure is required');
  } else {
    push(checkRange('Systolic BP', sys, ranges.bpSys, { allowEmpty: !ranges.bpSys.required }));
  }

  if (ranges.bpDia.required && (data.bpDia === '' || data.bpDia == null)) {
    errors.push('Diastolic blood pressure is required');
  } else {
    push(checkRange('Diastolic BP', dia, ranges.bpDia, { allowEmpty: !ranges.bpDia.required }));
  }

  if (
    sys != null &&
    !Number.isNaN(sys) &&
    dia != null &&
    !Number.isNaN(dia) &&
    sys <= dia
  ) {
    errors.push('Systolic BP must be greater than diastolic BP');
  }

  push(checkRange('Pulse', parseNum(data.pulse), ranges.pulse));
  push(checkRange('Respiratory rate', parseNum(data.respiratoryRate), ranges.respiratoryRate));
  push(checkRange('Temperature', parseNum(data.temperature), ranges.temperature));
  push(checkRange('Glucose', parseNum(data.glucose), ranges.glucose, { allowEmpty: true }));
  push(checkRange('O2 saturation', parseNum(data.o2), ranges.o2, { allowEmpty: !ranges.o2.required }));
  push(checkRange('Weight', parseNum(data.weight), ranges.weight, { allowEmpty: !ranges.weight.required }));

  const feet = parseNum(data.heightFeet);
  const inches = parseNum(data.heightInches);
  const heightRequired = ranges.heightFeet.required;
  if (heightRequired && (data.heightFeet === '' || data.heightFeet == null) && (data.heightInches === '' || data.heightInches == null)) {
    errors.push('Height is required');
  } else {
    if (data.heightFeet !== '' && data.heightFeet != null) {
      push(checkRange('Height (feet)', feet, ranges.heightFeet, { allowEmpty: true }));
    }
    if (data.heightInches !== '' && data.heightInches != null) {
      push(checkRange('Height (inches)', inches, { ...ranges.heightInches, min: 0, max: 11.9 }, { allowEmpty: true }));
    }
  }

  if (data.painAssessed === 'yes') {
    if (!data.painLevel) {
      errors.push('Pain level (1–10) is required when pain is assessed');
    } else {
      push(checkRange('Pain level', parseNum(data.painLevel), ranges.painLevel));
    }
  }

  if (data.customTime) {
    if (!data.timestampDate) errors.push('Custom timestamp date is required');
    if (!data.timestampTime) errors.push('Custom timestamp time is required');
  }

  return errors;
}

export function formatRangeHint(range) {
  if (!range) return '';
  const normal =
    range.normalMin != null && range.normalMax != null
      ? `Typical ${range.normalMin}–${range.normalMax}${range.unit ? ` ${range.unit}` : ''}`
      : '';
  const entry = `Entry ${range.min}–${range.max}${range.unit ? ` ${range.unit}` : ''}`;
  return normal ? `${normal} · ${entry}` : entry;
}

export function isOutOfNormal(value, range) {
  const n = parseNum(value);
  if (n == null || Number.isNaN(n) || !range || range.normalMin == null) return false;
  return n < range.normalMin || n > range.normalMax;
}
