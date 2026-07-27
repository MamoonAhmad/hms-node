const prisma = require('../lib/prisma');
const { randomUUID } = require('crypto');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true, role: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

const FIELD_LABELS = {
  name: 'Display Name',
  genericName: 'Generic Name',
  brandName: 'Brand Name',
  code: 'Medication Code',
  ndc: 'NDC Code',
  strength: 'Strength',
  strengthUnit: 'Strength Unit',
  dosageForm: 'Dosage Form',
  route: 'Route',
  medicationClass: 'Pharmacologic Class',
  medicationType: 'Medication Type',
  therapeuticCategory: 'Therapeutic Category',
  concentration: 'Concentration',
  manufacturer: 'Manufacturer',
  isControlledSubstance: 'Controlled Substance',
  controlledSubstanceSchedule: 'Controlled Substance Schedule',
  prescriptionRequired: 'Prescription Required',
  priorAuthorization: 'Prior Authorization',
  ageRestrictions: 'Age Restrictions',
  diagnosisRequired: 'Diagnosis Required',
  weightBasedDosing: 'Weight-Based Dosing',
  defaultFrequency: 'Frequency',
  defaultDose: 'Default Dose',
  defaultDoseUnit: 'Default Dose Unit',
  defaultDuration: 'Duration',
  durationUnit: 'Duration Unit',
  defaultQuantity: 'Default Quantity',
  refillAllowed: 'Refill Allowed',
  maximumRefills: 'Maximum Refills',
  description: 'Medication Description',
  instructions: 'SIG',
  indications: 'Indications',
  contraindications: 'Contraindications',
  warnings: 'Warnings',
  pregnancy: 'Pregnancy',
  lactation: 'Lactation',
  renalHepaticAdjustments: 'Renal/Hepatic Adjustments',
  rxNorm: 'RxNorm',
  atc: 'ATC',
  snomedCt: 'SNOMED CT',
  hcpcs: 'HCPCS',
  formularyStatus: 'Formulary Status',
  preferredDrug: 'Preferred Drug',
  alternativeMedication: 'Alternative Medication',
  drugMonograph: 'Drug Monograph',
  patientLeaflet: 'Patient Leaflet',
  effectiveDate: 'Effective Date',
  expiryDate: 'Expiry Date',
  isActive: 'Status',
};

const TRACKED_FIELDS = Object.keys(FIELD_LABELS);

function userDisplayName(user) {
  if (!user) return 'System';
  return user.name || user.email || 'System';
}

function parseRoutes(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return [value.trim()];
    }
  }
  return [];
}

function formatFieldValue(field, value) {
  if (field === 'isActive') {
    if (value === true || value === 'true') return 'Active';
    if (value === false || value === 'false') return 'Inactive';
  }
  if (
    field === 'isControlledSubstance' ||
    field === 'prescriptionRequired' ||
    field === 'refillAllowed' ||
    field === 'priorAuthorization' ||
    field === 'diagnosisRequired' ||
    field === 'weightBasedDosing' ||
    field === 'preferredDrug'
  ) {
    if (value === true || value === 'true') return 'Yes';
    if (value === false || value === 'false') return 'No';
  }
  if (field === 'route') {
    const routes = parseRoutes(value);
    return routes.length ? routes.join(', ') : '—';
  }
  if (field === 'effectiveDate' || field === 'expiryDate') {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toISOString().slice(0, 10);
  }
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function diffFields(before, after, keys = TRACKED_FIELDS) {
  const changes = [];
  keys.forEach((key) => {
    const oldStr = formatFieldValue(key, before?.[key]);
    const newStr = formatFieldValue(key, after?.[key]);
    if (oldStr !== newStr) {
      changes.push({
        field: key,
        label: FIELD_LABELS[key] || key,
        from: oldStr,
        to: newStr,
      });
    }
  });
  return changes;
}

function parseDateInput(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function emptyToNull(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

function toNonNegativeInt(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) {
    const err = new Error('Numeric fields must not be negative');
    err.statusCode = 400;
    throw err;
  }
  return Math.floor(n);
}

function toNonNegativeNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) {
    const err = new Error('Numeric fields must not be negative');
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function serializeRow(row, { includeHistory = false } = {}) {
  if (!row) return null;
  const routes = parseRoutes(row.route);
  return {
    id: row.id,
    name: row.name,
    genericName: row.genericName,
    brandName: row.brandName,
    code: row.code,
    ndc: row.ndc,
    strength: row.strength,
    strengthUnit: row.strengthUnit,
    dosageForm: row.dosageForm,
    route: routes,
    medicationClass: row.medicationClass,
    medicationType: row.medicationType,
    therapeuticCategory: row.therapeuticCategory,
    concentration: row.concentration,
    manufacturer: row.manufacturer,
    isControlledSubstance: row.isControlledSubstance,
    controlledSubstanceSchedule: row.controlledSubstanceSchedule,
    prescriptionRequired: row.prescriptionRequired,
    priorAuthorization: row.priorAuthorization,
    ageRestrictions: row.ageRestrictions,
    diagnosisRequired: row.diagnosisRequired,
    weightBasedDosing: row.weightBasedDosing,
    defaultFrequency: row.defaultFrequency,
    defaultDose: row.defaultDose,
    defaultDoseUnit: row.defaultDoseUnit,
    defaultDuration: row.defaultDuration,
    durationUnit: row.durationUnit,
    defaultQuantity: row.defaultQuantity,
    refillAllowed: row.refillAllowed,
    maximumRefills: row.maximumRefills,
    description: row.description,
    instructions: row.instructions,
    indications: row.indications,
    contraindications: row.contraindications,
    warnings: row.warnings,
    pregnancy: row.pregnancy,
    lactation: row.lactation,
    renalHepaticAdjustments: row.renalHepaticAdjustments,
    rxNorm: row.rxNorm,
    atc: row.atc,
    snomedCt: row.snomedCt,
    hcpcs: row.hcpcs,
    formularyStatus: row.formularyStatus,
    preferredDrug: row.preferredDrug,
    alternativeMedication: row.alternativeMedication,
    drugMonograph: row.drugMonograph,
    patientLeaflet: row.patientLeaflet,
    effectiveDate: row.effectiveDate,
    expiryDate: row.expiryDate,
    formularyTier: row.formularyTier,
    ndcSafetyFlag: row.ndcSafetyFlag,
    isActive: row.isActive,
    status: row.isActive ? 'Active' : 'Inactive',
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdByName: row.creator?.name || row.creator?.email || '—',
    updatedByName: row.updater?.name || row.updater?.email || '—',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    canDelete: row._count ? row._count.medicationOrders === 0 : undefined,
    history: includeHistory
      ? (row.history || []).map((h) => ({
          id: h.id,
          action: h.action,
          summary: h.summary,
          changes: h.changes,
          changedBy: h.changedBy,
          changedByName: h.changedByName,
          changedByRole: h.changedByRole,
          createdAt: h.createdAt,
        }))
      : undefined,
  };
}

function serializeSearchRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    strength: row.strength,
    strengthUnit: row.strengthUnit,
    dosageForm: row.dosageForm,
    medicationClass: row.medicationClass,
    medicationType: row.medicationType,
    therapeuticCategory: row.therapeuticCategory,
    concentration: row.concentration,
    ndc: row.ndc,
    rxNorm: row.rxNorm,
    formularyStatus: row.formularyStatus,
    formularyTier: row.formularyTier,
    preferredDrug: row.preferredDrug,
    ndcSafetyFlag: row.ndcSafetyFlag,
    isActive: row.isActive,
    genericName: row.genericName,
    brandName: row.brandName,
    route: parseRoutes(row.route),
    defaultFrequency: row.defaultFrequency,
    defaultDose: row.defaultDose,
    defaultDoseUnit: row.defaultDoseUnit,
    defaultDuration: row.defaultDuration,
    durationUnit: row.durationUnit,
    instructions: row.instructions,
    manufacturer: row.manufacturer,
    prescriptionRequired: row.prescriptionRequired,
    isControlledSubstance: row.isControlledSubstance,
  };
}

async function recordHistory(medicationCatalogId, { action, summary, changes, user }) {
  return prisma.medicationCatalogHistory.create({
    data: {
      medicationCatalogId,
      action,
      summary,
      changes: changes?.length ? changes : undefined,
      changedBy: user?.id || null,
      changedByName: userDisplayName(user),
      changedByRole: user?.role || null,
    },
  });
}

async function generateUniqueCode() {
  for (let i = 0; i < 8; i += 1) {
    const code = `MED-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const existing = await prisma.medicationCatalog.findFirst({
      where: { code, ...NOT_DELETED },
      select: { id: true },
    });
    if (!existing) return code;
  }
  return `MED-${Date.now()}`;
}

async function assertUniqueCode(code, excludeId = null) {
  const normalized = String(code || '').trim();
  if (!normalized) return;
  const existing = await prisma.medicationCatalog.findFirst({
    where: {
      code: { equals: normalized, mode: 'insensitive' },
      ...NOT_DELETED,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    const err = new Error('A medication with this code already exists');
    err.statusCode = 409;
    throw err;
  }
}

async function findDuplicate({ name, genericName, strength, strengthUnit, dosageForm }, excludeId = null) {
  return prisma.medicationCatalog.findFirst({
    where: {
      ...NOT_DELETED,
      name: { equals: String(name || '').trim(), mode: 'insensitive' },
      genericName: { equals: String(genericName || '').trim(), mode: 'insensitive' },
      strength: { equals: String(strength || '').trim(), mode: 'insensitive' },
      strengthUnit: String(strengthUnit || '').trim(),
      dosageForm: String(dosageForm || '').trim(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, name: true, code: true },
  });
}

function validateBusinessRules(data, existing = null) {
  const isControlled =
    data.isControlledSubstance !== undefined
      ? data.isControlledSubstance
      : existing?.isControlledSubstance;
  const schedule =
    data.controlledSubstanceSchedule !== undefined
      ? data.controlledSubstanceSchedule
      : existing?.controlledSubstanceSchedule;
  if (isControlled && !schedule) {
    const err = new Error('Controlled Substance Schedule is required when Controlled Substance is Yes');
    err.statusCode = 400;
    throw err;
  }

  const duration =
    data.defaultDuration !== undefined ? data.defaultDuration : existing?.defaultDuration;
  const durationUnit =
    data.durationUnit !== undefined ? data.durationUnit : existing?.durationUnit;
  if (duration != null && duration !== '' && !durationUnit) {
    const err = new Error('Duration Unit is required when Default Duration is entered');
    err.statusCode = 400;
    throw err;
  }

  const effectiveDate =
    data.effectiveDate !== undefined
      ? parseDateInput(data.effectiveDate)
      : existing?.effectiveDate
        ? new Date(existing.effectiveDate)
        : null;
  const expiryDate =
    data.expiryDate !== undefined
      ? parseDateInput(data.expiryDate)
      : existing?.expiryDate
        ? new Date(existing.expiryDate)
        : null;
  if (effectiveDate && expiryDate && expiryDate < effectiveDate) {
    const err = new Error('Expiry Date must not be earlier than Effective Date');
    err.statusCode = 400;
    throw err;
  }
}

function buildPayload(data, { forUpdate = false } = {}) {
  const payload = {};

  if (!forUpdate || data.name !== undefined) payload.name = String(data.name).trim();
  if (!forUpdate || data.genericName !== undefined) {
    payload.genericName = String(data.genericName).trim();
  }
  if (!forUpdate || data.brandName !== undefined) payload.brandName = emptyToNull(data.brandName);
  if (!forUpdate || data.code !== undefined) payload.code = emptyToNull(data.code);
  if (!forUpdate || data.ndc !== undefined) payload.ndc = emptyToNull(data.ndc);
  if (!forUpdate || data.strength !== undefined) payload.strength = String(data.strength).trim();
  if (!forUpdate || data.strengthUnit !== undefined) {
    payload.strengthUnit = String(data.strengthUnit).trim();
  }
  if (!forUpdate || data.dosageForm !== undefined) {
    payload.dosageForm = String(data.dosageForm).trim();
  }
  if (!forUpdate || data.route !== undefined) payload.route = parseRoutes(data.route);
  if (!forUpdate || data.medicationClass !== undefined) {
    payload.medicationClass = emptyToNull(data.medicationClass);
  }
  if (!forUpdate || data.medicationType !== undefined) {
    payload.medicationType = emptyToNull(data.medicationType);
  }
  if (!forUpdate || data.therapeuticCategory !== undefined) {
    payload.therapeuticCategory = emptyToNull(data.therapeuticCategory);
  }
  if (!forUpdate || data.concentration !== undefined) {
    payload.concentration = emptyToNull(data.concentration);
  }
  if (!forUpdate || data.manufacturer !== undefined) {
    payload.manufacturer = emptyToNull(data.manufacturer);
  }
  if (!forUpdate || data.isControlledSubstance !== undefined) {
    payload.isControlledSubstance = !!data.isControlledSubstance;
  }
  if (!forUpdate || data.controlledSubstanceSchedule !== undefined) {
    payload.controlledSubstanceSchedule = emptyToNull(data.controlledSubstanceSchedule);
  }
  if (!forUpdate || data.prescriptionRequired !== undefined) {
    payload.prescriptionRequired = data.prescriptionRequired !== false;
  }
  if (!forUpdate || data.priorAuthorization !== undefined) {
    payload.priorAuthorization = !!data.priorAuthorization;
  }
  if (!forUpdate || data.ageRestrictions !== undefined) {
    payload.ageRestrictions = emptyToNull(data.ageRestrictions);
  }
  if (!forUpdate || data.diagnosisRequired !== undefined) {
    payload.diagnosisRequired = !!data.diagnosisRequired;
  }
  if (!forUpdate || data.weightBasedDosing !== undefined) {
    payload.weightBasedDosing = !!data.weightBasedDosing;
  }
  if (!forUpdate || data.defaultFrequency !== undefined) {
    payload.defaultFrequency = emptyToNull(data.defaultFrequency);
  }
  if (!forUpdate || data.defaultDose !== undefined) {
    payload.defaultDose = emptyToNull(data.defaultDose);
  }
  if (!forUpdate || data.defaultDoseUnit !== undefined) {
    payload.defaultDoseUnit = emptyToNull(data.defaultDoseUnit);
  }
  if (!forUpdate || data.defaultDuration !== undefined) {
    payload.defaultDuration = toNonNegativeInt(data.defaultDuration);
  }
  if (!forUpdate || data.durationUnit !== undefined) {
    payload.durationUnit = emptyToNull(data.durationUnit);
  }
  if (!forUpdate || data.defaultQuantity !== undefined) {
    payload.defaultQuantity = toNonNegativeInt(data.defaultQuantity);
  }
  if (!forUpdate || data.refillAllowed !== undefined) {
    payload.refillAllowed = data.refillAllowed !== false;
  }
  if (!forUpdate || data.maximumRefills !== undefined) {
    payload.maximumRefills = toNonNegativeInt(data.maximumRefills);
  }
  if (!forUpdate || data.description !== undefined) {
    payload.description = emptyToNull(data.description);
  }
  if (!forUpdate || data.instructions !== undefined) {
    payload.instructions = emptyToNull(data.instructions);
  }
  if (!forUpdate || data.indications !== undefined) {
    payload.indications = emptyToNull(data.indications);
  }
  if (!forUpdate || data.contraindications !== undefined) {
    payload.contraindications = emptyToNull(data.contraindications);
  }
  if (!forUpdate || data.warnings !== undefined) {
    payload.warnings = emptyToNull(data.warnings);
  }
  if (!forUpdate || data.pregnancy !== undefined) {
    payload.pregnancy = emptyToNull(data.pregnancy);
  }
  if (!forUpdate || data.lactation !== undefined) {
    payload.lactation = emptyToNull(data.lactation);
  }
  if (!forUpdate || data.renalHepaticAdjustments !== undefined) {
    payload.renalHepaticAdjustments = emptyToNull(data.renalHepaticAdjustments);
  }
  if (!forUpdate || data.rxNorm !== undefined) {
    payload.rxNorm = emptyToNull(data.rxNorm);
  }
  if (!forUpdate || data.atc !== undefined) {
    payload.atc = emptyToNull(data.atc);
  }
  if (!forUpdate || data.snomedCt !== undefined) {
    payload.snomedCt = emptyToNull(data.snomedCt);
  }
  if (!forUpdate || data.hcpcs !== undefined) {
    payload.hcpcs = emptyToNull(data.hcpcs);
  }
  if (!forUpdate || data.formularyStatus !== undefined) {
    payload.formularyStatus = emptyToNull(data.formularyStatus);
  }
  if (!forUpdate || data.preferredDrug !== undefined) {
    payload.preferredDrug = !!data.preferredDrug;
  }
  if (!forUpdate || data.alternativeMedication !== undefined) {
    payload.alternativeMedication = emptyToNull(data.alternativeMedication);
  }
  if (!forUpdate || data.drugMonograph !== undefined) {
    payload.drugMonograph = emptyToNull(data.drugMonograph);
  }
  if (!forUpdate || data.patientLeaflet !== undefined) {
    payload.patientLeaflet = emptyToNull(data.patientLeaflet);
  }
  if (!forUpdate || data.effectiveDate !== undefined) {
    payload.effectiveDate = parseDateInput(data.effectiveDate);
  }
  if (!forUpdate || data.expiryDate !== undefined) {
    payload.expiryDate = parseDateInput(data.expiryDate);
  }
  if (!forUpdate || data.isActive !== undefined) {
    payload.isActive = data.isActive !== false;
  }

  if (!payload.isControlledSubstance) {
    payload.controlledSubstanceSchedule = null;
  }
  if (payload.defaultDuration == null) {
    if (!forUpdate || data.defaultDuration !== undefined || data.durationUnit !== undefined) {
      if (payload.defaultDuration === null) payload.durationUnit = null;
    }
  }

  return payload;
}

const medicationCatalogService = {
  async create(data, user) {
    validateBusinessRules(data);

    let code = emptyToNull(data.code);
    if (!code) {
      code = await generateUniqueCode();
    } else {
      await assertUniqueCode(code);
    }

    const duplicate = await findDuplicate(data);
    if (duplicate && !data.confirmDuplicate) {
      const err = new Error(
        'A similar medication already exists with the same name, generic name, strength, strength unit, and dosage form. Confirm to save anyway.',
      );
      err.statusCode = 409;
      err.code = 'DUPLICATE_MEDICATION';
      err.duplicate = duplicate;
      throw err;
    }

    const payload = buildPayload({ ...data, code });
    payload.code = code;
    payload.deletedAt = null;
    payload.createdBy = user?.id || null;
    payload.updatedBy = user?.id || null;

    const row = await prisma.medicationCatalog.create({
      data: payload,
      include: {
        ...auditInclude,
        _count: { select: { medicationOrders: true } },
      },
    });

    await recordHistory(row.id, {
      action: 'created',
      summary: 'Medication created',
      changes: diffFields({}, row),
      user,
    });

    return serializeRow(row);
  },

  async findAll({
    page = 1,
    limit = 10,
    search = '',
    status = '',
    dosageForm = '',
    route = '',
    medicationClass = '',
    therapeuticCategory = '',
    formularyStatus = '',
    isControlledSubstance,
    prescriptionRequired,
    sortBy = 'name',
    sortOrder = 'asc',
  }) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const conditions = [NOT_DELETED];

    if (search && String(search).trim()) {
      const q = String(search).trim();
      conditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { genericName: { contains: q, mode: 'insensitive' } },
          { brandName: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { ndc: { contains: q, mode: 'insensitive' } },
          { rxNorm: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (status === 'Active') conditions.push({ isActive: true });
    if (status === 'Inactive') conditions.push({ isActive: false });
    if (dosageForm) conditions.push({ dosageForm });
    if (route) {
      conditions.push({
        route: { array_contains: route },
      });
    }
    if (medicationClass) {
      conditions.push({ medicationClass: { contains: medicationClass, mode: 'insensitive' } });
    }
    if (therapeuticCategory) {
      conditions.push({ therapeuticCategory });
    }
    if (formularyStatus) {
      conditions.push({ formularyStatus });
    }
    if (typeof isControlledSubstance === 'boolean') {
      conditions.push({ isControlledSubstance });
    }
    if (typeof prescriptionRequired === 'boolean') {
      conditions.push({ prescriptionRequired });
    }

    const allowedSort = new Set([
      'name',
      'genericName',
      'strength',
      'isActive',
      'createdAt',
      'updatedAt',
    ]);
    const orderField = allowedSort.has(sortBy) ? sortBy : 'name';
    const orderDir = sortOrder === 'desc' ? 'desc' : 'asc';

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.medicationCatalog.findMany({
        where,
        skip,
        take,
        orderBy: [{ [orderField]: orderDir }],
        include: {
          ...auditInclude,
          _count: { select: { medicationOrders: true } },
        },
      }),
      prisma.medicationCatalog.count({ where }),
    ]);

    return {
      data: rows.map((row) => serializeRow(row)),
      pagination: {
        page: parseInt(page, 10) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async search({ search, limit = 50 }) {
    const q = String(search || '').trim();
    const take = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {
      ...NOT_DELETED,
      isActive: true,
      AND: [
        {
          OR: [{ effectiveDate: null }, { effectiveDate: { lte: today } }],
        },
        {
          OR: [{ expiryDate: null }, { expiryDate: { gte: today } }],
        },
        ...(q
          ? [
              {
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { genericName: { contains: q, mode: 'insensitive' } },
                  { brandName: { contains: q, mode: 'insensitive' } },
                  { code: { contains: q, mode: 'insensitive' } },
                  { ndc: { contains: q, mode: 'insensitive' } },
                  { rxNorm: { contains: q, mode: 'insensitive' } },
                  { medicationClass: { contains: q, mode: 'insensitive' } },
                  { therapeuticCategory: { contains: q, mode: 'insensitive' } },
                  { atc: { contains: q, mode: 'insensitive' } },
                ],
              },
            ]
          : []),
      ],
    };

    const rows = await prisma.medicationCatalog.findMany({
      where,
      orderBy: [
        { preferredDrug: 'desc' },
        { formularyStatus: 'asc' },
        { name: 'asc' },
      ],
      take,
    });

    return rows.map(serializeSearchRow);
  },

  async findById(id, { includeHistory = false } = {}) {
    const row = await prisma.medicationCatalog.findFirst({
      where: { id, ...NOT_DELETED },
      include: {
        ...auditInclude,
        _count: { select: { medicationOrders: true } },
        ...(includeHistory
          ? {
              history: {
                orderBy: { createdAt: 'desc' },
                take: 100,
              },
            }
          : {}),
      },
    });
    return serializeRow(row, { includeHistory });
  },

  async getHistory(id) {
    const existing = await prisma.medicationCatalog.findFirst({
      where: { id, ...NOT_DELETED },
      select: { id: true },
    });
    if (!existing) {
      const err = new Error('Medication not found');
      err.statusCode = 404;
      throw err;
    }

    const rows = await prisma.medicationCatalogHistory.findMany({
      where: { medicationCatalogId: id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return rows.map((h) => ({
      id: h.id,
      action: h.action,
      summary: h.summary,
      changes: h.changes,
      previousValue: Array.isArray(h.changes)
        ? h.changes.map((c) => `${c.label}: ${c.from}`).join('; ')
        : null,
      updatedValue: Array.isArray(h.changes)
        ? h.changes.map((c) => `${c.label}: ${c.to}`).join('; ')
        : null,
      changedBy: h.changedBy,
      changedByName: h.changedByName,
      changedByRole: h.changedByRole,
      createdAt: h.createdAt,
    }));
  },

  async update(id, data, user) {
    const existingRow = await prisma.medicationCatalog.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
    if (!existingRow) {
      const err = new Error('Medication not found');
      err.statusCode = 404;
      throw err;
    }

    validateBusinessRules(data, existingRow);

    if (data.code !== undefined) {
      const code = emptyToNull(data.code);
      if (code) await assertUniqueCode(code, id);
    }

    const mergedForDuplicate = {
      name: data.name !== undefined ? data.name : existingRow.name,
      genericName: data.genericName !== undefined ? data.genericName : existingRow.genericName,
      strength: data.strength !== undefined ? data.strength : existingRow.strength,
      strengthUnit: data.strengthUnit !== undefined ? data.strengthUnit : existingRow.strengthUnit,
      dosageForm: data.dosageForm !== undefined ? data.dosageForm : existingRow.dosageForm,
    };
    const duplicate = await findDuplicate(mergedForDuplicate, id);
    if (duplicate && !data.confirmDuplicate) {
      const err = new Error(
        'A similar medication already exists with the same name, generic name, strength, strength unit, and dosage form. Confirm to save anyway.',
      );
      err.statusCode = 409;
      err.code = 'DUPLICATE_MEDICATION';
      err.duplicate = duplicate;
      throw err;
    }

    const payload = buildPayload(data, { forUpdate: true });
    if (data.code !== undefined) {
      payload.code = emptyToNull(data.code) || existingRow.code;
    }
    payload.updatedBy = user?.id || null;

    const row = await prisma.medicationCatalog.update({
      where: { id },
      data: payload,
      include: {
        ...auditInclude,
        _count: { select: { medicationOrders: true } },
      },
    });

    const changes = diffFields(existingRow, row);
    const wasActive = existingRow.isActive;
    let action = 'updated';
    let summary = 'Medication updated';
    if (data.isActive !== undefined && data.isActive !== wasActive) {
      action = data.isActive ? 'activated' : 'deactivated';
      summary = data.isActive ? 'Medication activated' : 'Medication deactivated';
    }

    await recordHistory(row.id, {
      action,
      summary,
      changes,
      user,
    });

    return serializeRow(row);
  },

  async activate(id, user) {
    return this.update(id, { isActive: true, confirmDuplicate: true }, user);
  },

  async deactivate(id, user) {
    return this.update(id, { isActive: false, confirmDuplicate: true }, user);
  },

  async delete(id, user) {
    const existing = await prisma.medicationCatalog.findFirst({
      where: { id, ...NOT_DELETED },
      include: {
        ...auditInclude,
        _count: { select: { medicationOrders: true } },
      },
    });
    if (!existing) {
      const err = new Error('Medication not found');
      err.statusCode = 404;
      throw err;
    }

    if (existing._count.medicationOrders > 0) {
      await recordHistory(id, {
        action: 'delete_attempted',
        summary: 'Delete blocked — medication is in use; deactivated instead',
        changes: diffFields(existing, { ...existing, isActive: false }),
        user,
      });

      const row = await prisma.medicationCatalog.update({
        where: { id },
        data: {
          isActive: false,
          updatedBy: user?.id || null,
        },
        include: {
          ...auditInclude,
          _count: { select: { medicationOrders: true } },
        },
      });

      await recordHistory(id, {
        action: 'deactivated',
        summary: 'Medication deactivated (delete blocked — in use)',
        changes: [{ field: 'isActive', label: 'Status', from: 'Active', to: 'Inactive' }],
        user,
      });

      return {
        success: true,
        deactivated: true,
        message:
          'This medication has been used in patient prescriptions or orders and cannot be permanently deleted. It has been deactivated instead.',
        data: serializeRow(row),
      };
    }

    await recordHistory(id, {
      action: 'deleted',
      summary: 'Medication deleted',
      changes: diffFields(existing, { ...existing, deletedAt: new Date() }),
      user,
    });

    await prisma.medicationCatalog.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user?.id || null,
        updatedBy: user?.id || null,
        isActive: false,
      },
    });

    return {
      success: true,
      deactivated: false,
      message: 'Medication deleted successfully',
    };
  },
};

module.exports = medicationCatalogService;
