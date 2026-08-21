export const HCPCS_CATEGORIES = [
  { value: 'A', label: 'A — Transportation / supplies' },
  { value: 'B', label: 'B — Enteral / parenteral' },
  { value: 'C', label: 'C — Outpatient PPS' },
  { value: 'E', label: 'E — DME' },
  { value: 'G', label: 'G — Temporary professional' },
  { value: 'H', label: 'H — Behavioral health' },
  { value: 'J', label: 'J — Injectable drugs' },
  { value: 'K', label: 'K — Temporary DME' },
  { value: 'L', label: 'L — Orthotic / prosthetic' },
  { value: 'M', label: 'M — Medical services' },
  { value: 'P', label: 'P — Pathology / lab' },
  { value: 'Q', label: 'Q — Temporary codes' },
  { value: 'R', label: 'R — Diagnostic radiology' },
  { value: 'S', label: 'S — Temporary national' },
  { value: 'T', label: 'T — Medicaid' },
  { value: 'V', label: 'V — Vision / hearing' },
];

export const ICD10_CHAPTERS = [
  { value: 'A00-B99', label: 'A00–B99 Infectious' },
  { value: 'C00-D49', label: 'C00–D49 Neoplasms' },
  { value: 'D50-D89', label: 'D50–D89 Blood / immune' },
  { value: 'E00-E89', label: 'E00–E89 Endocrine / metabolic' },
  { value: 'F01-F99', label: 'F01–F99 Mental / behavioral' },
  { value: 'G00-G99', label: 'G00–G99 Nervous system' },
  { value: 'H00-H59', label: 'H00–H59 Eye' },
  { value: 'H60-H95', label: 'H60–H95 Ear' },
  { value: 'I00-I99', label: 'I00–I99 Circulatory' },
  { value: 'J00-J99', label: 'J00–J99 Respiratory' },
  { value: 'K00-K95', label: 'K00–K95 Digestive' },
  { value: 'L00-L99', label: 'L00–L99 Skin' },
  { value: 'M00-M99', label: 'M00–M99 Musculoskeletal' },
  { value: 'N00-N99', label: 'N00–N99 Genitourinary' },
  { value: 'O00-O9A', label: 'O00–O9A Pregnancy' },
  { value: 'P00-P96', label: 'P00–P96 Perinatal' },
  { value: 'Q00-Q99', label: 'Q00–Q99 Congenital' },
  { value: 'R00-R99', label: 'R00–R99 Symptoms / signs' },
  { value: 'S00-T88', label: 'S00–T88 Injury / poisoning' },
  { value: 'U00-U85', label: 'U00–U85 Special purposes' },
  { value: 'V00-Y99', label: 'V00–Y99 External causes' },
  { value: 'Z00-Z99', label: 'Z00–Z99 Health status' },
];

export const COVERAGE_STATUSES = [
  { value: 'covered', label: 'Covered' },
  { value: 'non_covered', label: 'Non-covered' },
  { value: 'bundled', label: 'Bundled' },
  { value: 'restricted', label: 'Restricted' },
];

export const CPT_CODE_TYPES = [
  { value: 'CPT', label: 'CPT' },
  { value: 'HCPCS', label: 'HCPCS' },
  { value: 'CUSTOM', label: 'Custom / local' },
];

export const LATERALITY_VALUES = [
  { value: 'none', label: 'None' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'bilateral', label: 'Bilateral' },
  { value: 'unspecified', label: 'Unspecified' },
];

export const GENDER_RESTRICTIONS = [
  { value: 'none', label: 'None' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const GLOBAL_PERIODS = [
  { value: '000', label: '000 — Endoscopic / 0 day' },
  { value: '010', label: '010 — Minor (10 day)' },
  { value: '090', label: '090 — Major (90 day)' },
  { value: 'XXX', label: 'XXX — Global concept does not apply' },
  { value: 'YYY', label: 'YYY — Carrier priced' },
  { value: 'ZZZ', label: 'ZZZ — Add-on / related' },
];

export const UNIT_TYPES = [
  { value: 'unit', label: 'Unit' },
  { value: 'each', label: 'Each' },
  { value: 'ml', label: 'mL' },
  { value: 'mg', label: 'mg' },
  { value: 'mcg', label: 'mcg' },
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
];

export function normalizeIcd10(code) {
  const raw = String(code || '').trim().toUpperCase().replace(/\s/g, '');
  if (!raw) return '';
  if (raw.includes('.')) return raw;
  if (raw.length <= 3) return raw;
  return `${raw.slice(0, 3)}.${raw.slice(3)}`;
}

export function isValidIcd10(code) {
  return /^[A-TV-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?$/.test(normalizeIcd10(code));
}

export function isValidCpt(code) {
  return /^\d{5}$/.test(String(code || '').trim());
}

export function isValidHcpcs(code) {
  return /^[A-V]\d{4}$/i.test(String(code || '').trim());
}

export function isValidRevenueCode(code) {
  if (!code) return true;
  return /^\d{3,4}$/.test(String(code).trim());
}

export function isValidModifier(code) {
  if (!code) return true;
  return /^[A-Z0-9]{2}$/i.test(String(code).trim());
}

export function datesInOrder(start, end) {
  if (!start || !end) return true;
  return new Date(end) >= new Date(start);
}
