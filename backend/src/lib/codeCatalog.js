const HCPCS_CATEGORIES = [
  { value: 'A', label: 'A — Transportation / medical & surgical supplies' },
  { value: 'B', label: 'B — Enteral and parenteral therapy' },
  { value: 'C', label: 'C — Outpatient PPS / pass-through' },
  { value: 'E', label: 'E — Durable medical equipment' },
  { value: 'G', label: 'G — Temporary procedures / professional services' },
  { value: 'H', label: 'H — Behavioral health / rehabilitative services' },
  { value: 'J', label: 'J — Drugs administered other than oral' },
  { value: 'K', label: 'K — Temporary DME codes' },
  { value: 'L', label: 'L — Orthotic and prosthetic procedures' },
  { value: 'M', label: 'M — Medical services' },
  { value: 'P', label: 'P — Pathology and laboratory' },
  { value: 'Q', label: 'Q — Temporary codes' },
  { value: 'R', label: 'R — Diagnostic radiology services' },
  { value: 'S', label: 'S — Temporary national codes (non-Medicare)' },
  { value: 'T', label: 'T — State Medicaid agency codes' },
  { value: 'V', label: 'V — Vision and hearing services' },
];

const ICD10_CHAPTERS = [
  { value: 'A00-B99', label: 'A00–B99 Infectious and parasitic diseases' },
  { value: 'C00-D49', label: 'C00–D49 Neoplasms' },
  { value: 'D50-D89', label: 'D50–D89 Blood and immune disorders' },
  { value: 'E00-E89', label: 'E00–E89 Endocrine, nutritional and metabolic' },
  { value: 'F01-F99', label: 'F01–F99 Mental, behavioral and neurodevelopmental' },
  { value: 'G00-G99', label: 'G00–G99 Nervous system' },
  { value: 'H00-H59', label: 'H00–H59 Eye and adnexa' },
  { value: 'H60-H95', label: 'H60–H95 Ear and mastoid process' },
  { value: 'I00-I99', label: 'I00–I99 Circulatory system' },
  { value: 'J00-J99', label: 'J00–J99 Respiratory system' },
  { value: 'K00-K95', label: 'K00–K95 Digestive system' },
  { value: 'L00-L99', label: 'L00–L99 Skin and subcutaneous tissue' },
  { value: 'M00-M99', label: 'M00–M99 Musculoskeletal and connective tissue' },
  { value: 'N00-N99', label: 'N00–N99 Genitourinary system' },
  { value: 'O00-O9A', label: 'O00–O9A Pregnancy, childbirth and puerperium' },
  { value: 'P00-P96', label: 'P00–P96 Perinatal period' },
  { value: 'Q00-Q99', label: 'Q00–Q99 Congenital malformations' },
  { value: 'R00-R99', label: 'R00–R99 Symptoms, signs and abnormal findings' },
  { value: 'S00-T88', label: 'S00–T88 Injury, poisoning and external causes' },
  { value: 'U00-U85', label: 'U00–U85 Codes for special purposes' },
  { value: 'V00-Y99', label: 'V00–Y99 External causes of morbidity' },
  { value: 'Z00-Z99', label: 'Z00–Z99 Factors influencing health status' },
];

const CPT_CODE_TYPES = ['CPT', 'HCPCS', 'CUSTOM'];
const COVERAGE_STATUSES = ['covered', 'non_covered', 'bundled', 'restricted'];
const LATERALITY_VALUES = ['none', 'left', 'right', 'bilateral', 'unspecified'];
const GENDER_RESTRICTIONS = ['none', 'male', 'female'];
const GLOBAL_PERIODS = ['000', '010', '090', 'XXX', 'YYY', 'ZZZ'];
const UNIT_TYPES = ['unit', 'each', 'ml', 'mg', 'mcg', 'hour', 'day'];

const ICD10_RE = /^[A-TV-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?$/;
const CPT_RE = /^\d{5}$/;
const HCPCS_RE = /^[A-V]\d{4}$/;
const REVENUE_RE = /^\d{3,4}$/;
const MODIFIER_RE = /^[A-Z0-9]{2}$/;

function normalizeIcd10(code) {
  const raw = String(code || '').trim().toUpperCase().replace(/\s/g, '');
  if (!raw) return '';
  if (raw.includes('.')) return raw;
  if (raw.length <= 3) return raw;
  return `${raw.slice(0, 3)}.${raw.slice(3)}`;
}

function normalizeHcpcs(code) {
  return String(code || '').trim().toUpperCase();
}

function normalizeCpt(code) {
  return String(code || '').trim();
}

function isValidIcd10(code) {
  const normalized = normalizeIcd10(code);
  return Boolean(normalized) && ICD10_RE.test(normalized);
}

function isValidCpt(code) {
  return CPT_RE.test(normalizeCpt(code));
}

function isValidHcpcs(code) {
  return HCPCS_RE.test(normalizeHcpcs(code));
}

function isValidRevenueCode(code) {
  if (code == null || String(code).trim() === '') return true;
  return REVENUE_RE.test(String(code).trim());
}

function isValidModifier(code) {
  if (code == null || String(code).trim() === '') return true;
  return MODIFIER_RE.test(String(code).trim().toUpperCase());
}

function deriveHcpcsCategory(code) {
  const letter = normalizeHcpcs(code).charAt(0);
  return /[A-V]/.test(letter) ? letter : null;
}

function deriveIcdChapter(code) {
  const normalized = normalizeIcd10(code);
  if (!normalized) return null;
  const letter = normalized.charAt(0);
  const map = {
    A: 'A00-B99',
    B: 'A00-B99',
    C: 'C00-D49',
    E: 'E00-E89',
    F: 'F01-F99',
    G: 'G00-G99',
    I: 'I00-I99',
    J: 'J00-J99',
    K: 'K00-K95',
    L: 'L00-L99',
    M: 'M00-M99',
    N: 'N00-N99',
    O: 'O00-O9A',
    P: 'P00-P96',
    Q: 'Q00-Q99',
    R: 'R00-R99',
    S: 'S00-T88',
    T: 'S00-T88',
    U: 'U00-U85',
    V: 'V00-Y99',
    W: 'V00-Y99',
    X: 'V00-Y99',
    Y: 'V00-Y99',
    Z: 'Z00-Z99',
  };
  if (letter === 'D') {
    const second = normalized.charAt(1);
    return second >= '5' ? 'D50-D89' : 'C00-D49';
  }
  if (letter === 'H') {
    const second = normalized.charAt(1);
    return second >= '6' ? 'H60-H95' : 'H00-H59';
  }
  return map[letter] || null;
}

function parseOptionalDate(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function assertDateRange(effectiveDate, expiryDate, labels = {}) {
  const start = parseOptionalDate(effectiveDate);
  const end = parseOptionalDate(expiryDate);
  if (start && end && end < start) {
    const err = new Error(
      `${labels.expiry || 'Expiry date'} cannot be before ${labels.effective || 'effective date'}`,
    );
    err.statusCode = 400;
    throw err;
  }
}

function assertAgeRange(ageMin, ageMax) {
  if (ageMin != null && ageMax != null && Number(ageMax) < Number(ageMin)) {
    const err = new Error('Maximum age cannot be less than minimum age');
    err.statusCode = 400;
    throw err;
  }
}

function isCurrentlyValid(row, onDate = new Date()) {
  if (!row) return false;
  if (row.isActive === false) return false;
  const on = onDate instanceof Date ? onDate : new Date(onDate);
  if (Number.isNaN(on.getTime())) return true;
  if (row.effectiveDate && new Date(row.effectiveDate) > on) return false;
  if (row.expiryDate && new Date(row.expiryDate) < on) return false;
  return true;
}

function splitProcedureCode(code) {
  const raw = String(code || '').trim().toUpperCase();
  if (isValidCpt(raw)) return { cptCode: raw, hcpcsCode: null, codeType: 'CPT' };
  if (isValidHcpcs(raw)) return { cptCode: null, hcpcsCode: raw, codeType: 'HCPCS' };
  return { cptCode: raw || null, hcpcsCode: null, codeType: 'CUSTOM' };
}

function catalogIssue(severity, code, message) {
  return { severity, code, message };
}

function evaluateCatalogRow(row, { label, requireBillable = true } = {}) {
  const issues = [];
  if (!row) {
    issues.push(catalogIssue('warning', 'NOT_IN_CATALOG', `${label} is not in the facility catalog`));
    return issues;
  }
  if (row.isActive === false) {
    issues.push(catalogIssue('error', 'INACTIVE', `${label} is inactive and cannot be billed`));
  }
  if (requireBillable && row.isBillable === false) {
    issues.push(catalogIssue('error', 'NOT_BILLABLE', `${label} is not a billable code`));
  }
  if (!isCurrentlyValid({ ...row, isActive: row.isActive !== false })) {
    issues.push(catalogIssue('error', 'NOT_EFFECTIVE', `${label} is outside its effective date range`));
  }
  if (row.coverageStatus === 'non_covered') {
    issues.push(catalogIssue('warning', 'NON_COVERED', `${label} is marked non-covered`));
  }
  if (row.coverageStatus === 'bundled') {
    issues.push(catalogIssue('warning', 'BUNDLED', `${label} is typically bundled and may not pay separately`));
  }
  return issues;
}

function decimalOrNull(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(value) {
  if (value == null || value === '') return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function emptyToNull(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

function boolOrDefault(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return !!value;
}

module.exports = {
  HCPCS_CATEGORIES,
  ICD10_CHAPTERS,
  CPT_CODE_TYPES,
  COVERAGE_STATUSES,
  LATERALITY_VALUES,
  GENDER_RESTRICTIONS,
  GLOBAL_PERIODS,
  UNIT_TYPES,
  normalizeIcd10,
  normalizeHcpcs,
  normalizeCpt,
  isValidIcd10,
  isValidCpt,
  isValidHcpcs,
  isValidRevenueCode,
  isValidModifier,
  deriveHcpcsCategory,
  deriveIcdChapter,
  parseOptionalDate,
  assertDateRange,
  assertAgeRange,
  isCurrentlyValid,
  splitProcedureCode,
  evaluateCatalogRow,
  decimalOrNull,
  intOrNull,
  emptyToNull,
  boolOrDefault,
};
