const diagnosisCodeService = require('./diagnosisCode.service');
const hcpcsCodeService = require('./hcpcsCode.service');
const procedureService = require('./procedure.service');
const {
  normalizeIcd10,
  isValidIcd10,
  isValidCpt,
  isValidHcpcs,
  splitProcedureCode,
  evaluateCatalogRow,
} = require('../lib/codeCatalog');

async function resolveDiagnosis(code) {
  const normalized = normalizeIcd10(code);
  if (!normalized) return { code: '', catalog: null, issues: [] };
  const catalog = await diagnosisCodeService.findByCode(normalized);
  const issues = [];
  if (!isValidIcd10(normalized)) {
    issues.push({
      severity: 'error',
      code: 'ICD_FORMAT',
      message: `ICD-10-CM code ${normalized} has an invalid format`,
    });
  }
  issues.push(...evaluateCatalogRow(catalog, { label: `Diagnosis ${normalized}` }));
  return {
    code: catalog?.code || normalized,
    description: catalog?.description || null,
    catalog,
    issues,
  };
}

async function resolveProcedureCode(code) {
  const raw = String(code || '').trim().toUpperCase();
  if (!raw) return { code: '', catalog: null, issues: [] };

  const split = splitProcedureCode(raw);
  const [procedure, hcpcs] = await Promise.all([
    procedureService.findByCpt(raw),
    split.codeType === 'HCPCS' ? hcpcsCodeService.findByCode(raw) : Promise.resolve(null),
  ]);

  const catalog = procedure || hcpcs;
  const issues = [];
  if (split.codeType === 'CPT' && !isValidCpt(raw)) {
    issues.push({ severity: 'error', code: 'CPT_FORMAT', message: `CPT code ${raw} must be 5 digits` });
  }
  if (split.codeType === 'HCPCS' && !isValidHcpcs(raw)) {
    issues.push({
      severity: 'error',
      code: 'HCPCS_FORMAT',
      message: `HCPCS code ${raw} must be a letter A–V followed by 4 digits`,
    });
  }
  issues.push(
    ...evaluateCatalogRow(catalog, {
      label: `${split.codeType} ${raw}`,
    }),
  );

  return {
    code: raw,
    cptCode: split.cptCode,
    hcpcsCode: split.hcpcsCode || (catalog && !procedure ? catalog.code : null),
    description: catalog?.procedureDescription || catalog?.description || null,
    unitCharge: catalog?.unitPrice != null ? Number(catalog.unitPrice) : null,
    placeOfService: catalog?.placeOfService || null,
    revenueCode: catalog?.revenueCode || null,
    modifiers: [catalog?.mod1, catalog?.mod2, catalog?.mod3, catalog?.mod4, catalog?.defaultModifier]
      .filter(Boolean)
      .join(','),
    catalog,
    issues,
  };
}

async function enrichDiagnoses(diagnoses = []) {
  const enriched = [];
  const issues = [];
  for (const [idx, row] of diagnoses.entries()) {
    const resolved = await resolveDiagnosis(row.code);
    issues.push(
      ...resolved.issues.map((issue) => ({
        ...issue,
        message: `Dx ${idx + 1}: ${issue.message}`,
      })),
    );
    enriched.push({
      ...row,
      code: resolved.code || row.code,
      description: row.description || resolved.description || row.description,
      catalogId: resolved.catalog?.id || null,
    });
  }
  return { diagnoses: enriched, issues };
}

async function enrichCharges(charges = []) {
  const enriched = [];
  const issues = [];
  for (const [idx, row] of charges.entries()) {
    const code = row.cptCode || row.hcpcsCode || row.code;
    const resolved = await resolveProcedureCode(code);
    issues.push(
      ...resolved.issues.map((issue) => ({
        ...issue,
        message: `Line ${idx + 1}: ${issue.message}`,
      })),
    );
    const split = splitProcedureCode(code);
    enriched.push({
      ...row,
      cptCode: row.cptCode || resolved.cptCode || (split.codeType === 'CPT' ? code : null),
      hcpcsCode: row.hcpcsCode || resolved.hcpcsCode || (split.codeType === 'HCPCS' ? code : null),
      description: row.description || resolved.description || row.description,
      unitCharge: Number(row.unitCharge) || resolved.unitCharge || 0,
      placeOfService: row.placeOfService || resolved.placeOfService || '11',
      revenueCode: row.revenueCode || resolved.revenueCode || null,
      modifiers: row.modifiers || resolved.modifiers || '',
      catalogId: resolved.catalog?.id || null,
    });
  }
  return { charges: enriched, issues };
}

module.exports = {
  resolveDiagnosis,
  resolveProcedureCode,
  enrichDiagnoses,
  enrichCharges,
};
