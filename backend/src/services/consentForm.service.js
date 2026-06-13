const prisma = require('../lib/prisma');
const { CONSENT_LIST_TABS } = require('../constants/consentForm.constants');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateInput(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function resolveEffectiveStatus(record) {
  const today = startOfDay(new Date());

  if (record.expiryDate && startOfDay(record.expiryDate) < today) {
    return 'inactive';
  }

  if (record.effectiveDate && startOfDay(record.effectiveDate) > today) {
    return record.status === 'draft' ? 'draft' : 'inactive';
  }

  if (
    record.status === 'draft' &&
    record.effectiveDate &&
    startOfDay(record.effectiveDate) <= today
  ) {
    return 'active';
  }

  return record.status;
}

function hasSignatureRequirement(record) {
  return (
    record.isSignatureRequired === true ||
    record.requiresWitnessSignature === true ||
    record.requiresProviderSignature === true
  );
}

function matchesTab(record, tab) {
  const effectiveStatus = resolveEffectiveStatus(record);
  switch (tab) {
    case 'active':
      return effectiveStatus === 'active';
    case 'draft':
      return effectiveStatus === 'draft';
    case 'inactive':
      return effectiveStatus === 'inactive';
    case 'signature':
      return hasSignatureRequirement(record);
    default:
      return true;
  }
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function serializeRecord(row) {
  if (!row) return null;
  const effectiveStatus = resolveEffectiveStatus(row);
  return {
    ...row,
    effectiveDate: row.effectiveDate
      ? row.effectiveDate.toISOString().slice(0, 10)
      : '',
    expiryDate: row.expiryDate ? row.expiryDate.toISOString().slice(0, 10) : '',
    effectiveStatus,
    createdDate: row.createdAt,
    updatedDate: row.updatedAt,
    createdBy: row.creator?.name || row.creator?.email || row.createdBy,
    updatedBy: row.updater?.name || row.updater?.email || row.updatedBy,
  };
}

function buildPayload(data) {
  const payload = {};

  if (data.consentTitle !== undefined) payload.consentTitle = String(data.consentTitle).trim();
  if (data.consentType !== undefined) payload.consentType = data.consentType;
  if (data.description !== undefined) {
    payload.description =
      data.description == null || String(data.description).trim() === ''
        ? null
        : String(data.description).trim();
  }
  if (data.consentContent !== undefined) payload.consentContent = data.consentContent;
  if (data.isMandatory !== undefined) payload.isMandatory = !!data.isMandatory;
  if (data.isSignatureRequired !== undefined) {
    payload.isSignatureRequired = !!data.isSignatureRequired;
  }
  if (data.patientSignaturePlacement !== undefined) {
    payload.patientSignaturePlacement = data.patientSignaturePlacement || null;
  }
  if (data.requiresWitnessSignature !== undefined) {
    payload.requiresWitnessSignature = !!data.requiresWitnessSignature;
  }
  if (data.witnessSignaturePlacement !== undefined) {
    payload.witnessSignaturePlacement = data.witnessSignaturePlacement || null;
  }
  if (data.requiresProviderSignature !== undefined) {
    payload.requiresProviderSignature = !!data.requiresProviderSignature;
  }
  if (data.providerSignaturePlacement !== undefined) {
    payload.providerSignaturePlacement = data.providerSignaturePlacement || null;
  }
  if (data.effectiveDate !== undefined) payload.effectiveDate = parseDateInput(data.effectiveDate);
  if (data.expiryDate !== undefined) payload.expiryDate = parseDateInput(data.expiryDate);
  if (data.status !== undefined) payload.status = data.status;
  if (data.department !== undefined) {
    payload.department =
      data.department == null || String(data.department).trim() === ''
        ? null
        : String(data.department).trim();
  }
  if (data.language !== undefined) {
    payload.language =
      data.language == null || String(data.language).trim() === ''
        ? null
        : String(data.language).trim();
  }
  if (data.versionNumber !== undefined) {
    payload.versionNumber =
      data.versionNumber == null || String(data.versionNumber).trim() === ''
        ? null
        : String(data.versionNumber).trim();
  }
  if (data.tags !== undefined) {
    payload.tags =
      data.tags == null || String(data.tags).trim() === '' ? null : String(data.tags).trim();
  }
  if (data.attachmentName !== undefined) {
    payload.attachmentName = data.attachmentName || null;
  }
  if (data.attachmentDataUrl !== undefined) {
    payload.attachmentDataUrl = data.attachmentDataUrl || null;
  }

  if (payload.isSignatureRequired === false) {
    payload.patientSignaturePlacement = null;
  }
  if (payload.requiresWitnessSignature === false) {
    payload.witnessSignaturePlacement = null;
  }
  if (payload.requiresProviderSignature === false) {
    payload.providerSignaturePlacement = null;
  }

  return payload;
}

function validateSignatureFields(record) {
  const errors = [];
  if (record.isSignatureRequired !== false && !record.patientSignaturePlacement) {
    errors.push('Select where the patient signature should appear');
  }
  if (record.requiresWitnessSignature && !record.witnessSignaturePlacement) {
    errors.push('Select where the witness signature should appear');
  }
  if (record.requiresProviderSignature && !record.providerSignaturePlacement) {
    errors.push('Select where the provider signature should appear');
  }
  if (errors.length) {
    const err = new Error(errors.join('; '));
    err.statusCode = 400;
    throw err;
  }
}

const consentFormService = {
  async create(data, userId) {
    if (!stripHtml(data.consentContent)) {
      const err = new Error('Consent content is required');
      err.statusCode = 400;
      throw err;
    }

    const normalized = {
      ...data,
      isSignatureRequired: data.isSignatureRequired !== false,
      requiresWitnessSignature: !!data.requiresWitnessSignature,
      requiresProviderSignature: !!data.requiresProviderSignature,
    };
    validateSignatureFields(normalized);

    const payload = buildPayload(normalized);

    const row = await prisma.consentForm.create({
      data: {
        ...payload,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });

    return serializeRecord(row);
  },

  async findAll({ page = 1, limit = 10, search = '', tab = 'all' }) {
    const conditions = [NOT_DELETED];

    if (search) {
      conditions.push({
        OR: [
          { consentTitle: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } },
          { tags: { contains: search, mode: 'insensitive' } },
          { language: { contains: search, mode: 'insensitive' } },
          { versionNumber: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const rows = await prisma.consentForm.findMany({
      where: { AND: conditions },
      orderBy: [{ updatedAt: 'desc' }],
      include: auditInclude,
    });

    const serialized = rows.map(serializeRecord);
    const tabFiltered = serialized.filter((row) => matchesTab(row, tab));

    const tabCounts = {};
    CONSENT_LIST_TABS.forEach((t) => {
      tabCounts[t] = serialized.filter((row) => matchesTab(row, t)).length;
    });

    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const total = tabFiltered.length;
    const data = tabFiltered.slice(skip, skip + take);

    return {
      data,
      tabCounts,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async findById(id) {
    const row = await prisma.consentForm.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
    return serializeRecord(row);
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Consent form not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.consentContent !== undefined && !stripHtml(data.consentContent)) {
      const err = new Error('Consent content is required');
      err.statusCode = 400;
      throw err;
    }

    const merged = {
      ...existing,
      ...data,
      isSignatureRequired:
        data.isSignatureRequired !== undefined
          ? data.isSignatureRequired !== false
          : existing.isSignatureRequired !== false,
      requiresWitnessSignature:
        data.requiresWitnessSignature !== undefined
          ? !!data.requiresWitnessSignature
          : !!existing.requiresWitnessSignature,
      requiresProviderSignature:
        data.requiresProviderSignature !== undefined
          ? !!data.requiresProviderSignature
          : !!existing.requiresProviderSignature,
      patientSignaturePlacement:
        data.patientSignaturePlacement !== undefined
          ? data.patientSignaturePlacement
          : existing.patientSignaturePlacement,
      witnessSignaturePlacement:
        data.witnessSignaturePlacement !== undefined
          ? data.witnessSignaturePlacement
          : existing.witnessSignaturePlacement,
      providerSignaturePlacement:
        data.providerSignaturePlacement !== undefined
          ? data.providerSignaturePlacement
          : existing.providerSignaturePlacement,
    };
    validateSignatureFields(merged);

    const payload = buildPayload(data);
    payload.updatedBy = userId;

    const row = await prisma.consentForm.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });

    return serializeRecord(row);
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Consent form not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.consentForm.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        status: 'inactive',
        updatedBy: userId,
      },
      include: auditInclude,
    });
  },
};

module.exports = consentFormService;
