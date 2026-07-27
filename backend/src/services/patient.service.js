const prisma = require('../lib/prisma');
const appointmentService = require('./appointment.service');
const consentFormService = require('./consentForm.service');
const { generateNextMrn } = require('../utils/generateMrn');
const { diffPatientFields } = require('../utils/patientActivity');

const NOT_DELETED = { deletedAt: null };

const PATIENT_WRITABLE_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'suffix',
  'preferredName',
  'previousName',
  'dateOfBirth',
  'gender',
  'genderIdentity',
  'pronouns',
  'ssn',
  'contactNumber',
  'preferredContactMethod',
  'email',
  'address',
  'addressLine2',
  'city',
  'state',
  'zip',
  'country',
  'homePhone',
  'workPhone',
  'cellPhone',
  'governmentIdType',
  'governmentIdNumber',
  'birthPlace',
  'veteranStatus',
  'disabilityStatus',
  'tribalAffiliation',
  'generalNotes',
  'ethnicity',
  'sexualOrientation',
  'race',
  'language',
  'interpreterRequired',
  'interpreterLanguageRequired',
  'maritalStatus',
  'employmentStatus',
  'employerName',
  'occupation',
  'employerPhoneNumber',
  'employerStreetAddress',
  'employerCity',
  'employerState',
  'employerZip',
  'otherInfo',
  'insuranceProviderId',
  'policyNumber',
  'copay',
  'deductible',
  'primaryCarePhysician',
  'primaryCareProviderId',
  'referringPhysicianFirstName',
  'referringPhysicianLastName',
  'referringPhysicianNpi',
  'referringPhysicianPhone',
  'referringPhysicianFax',
  'referringPhysicianAddress',
  'referringPhysicianCity',
  'referringPhysicianState',
  'referringPhysicianZip',
  'profilePhoto',
  'emergencyContactName',
  'emergencyContactNumber',
  'emergencyContactRelationship',
  'emergencyContactEmail',
  'emergencyContactAddress',
  'emergencyContactCity',
  'emergencyContactState',
  'emergencyContactZip',
  'secondaryEmergencyContactName',
  'secondaryEmergencyContactRelationship',
  'secondaryEmergencyContactNumber',
  'secondaryEmergencyContactEmail',
  'guarantorName',
  'guarantorPhone',
  'guarantorRelationship',
  'guarantorEmail',
  'guarantorAddress',
  'guarantorCity',
  'guarantorState',
  'guarantorZip',
  'guarantorDateOfBirth',
  'authorizedRepresentativeName',
  'authorizedRepresentativeRelationship',
  'authorizedRepresentativePhone',
  'authorizedRepresentativeEmail',
  'legalGuardianName',
  'legalGuardianRelationship',
  'legalGuardianPhone',
  'legalGuardianEmail',
  'patientIsMinor',
  'primaryNextOfKinName',
  'primaryNextOfKinRelationship',
  'primaryNextOfKinPhone',
  'secondaryNextOfKinName',
  'secondaryNextOfKinRelationship',
  'secondaryNextOfKinPhone',
  'subscriberPhone',
  'subscriberSsnLast4',
  'subscriberEmployer',
  'subscriberAddress',
  'subscriberCity',
  'subscriberState',
  'subscriberZip',
  'subscriberEmail',
  'registrationStatus',
  'registrationChannel',
  'billingType',
  'paymentMethod',
  'assignedToId',
  'consentFormSigned',
  'noEmail',
  'militaryBranch',
  'disabilities',
  'interpreterLanguages',
  'visitModality',
  'accessibilityRequirements',
  'accessibilityRequirementsNotes',
];

const listInclude = {
  insuranceProvider: {
    select: { id: true, name: true, code: true },
  },
  insurances: {
    include: {
      insuranceProvider: { select: { id: true, name: true, code: true } },
    },
    orderBy: { insuranceType: 'asc' },
  },
  assignedTo: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
  updater: { select: { id: true, name: true, email: true } },
  appointments: {
    orderBy: { appointmentDate: 'desc' },
    take: 1,
    select: { id: true, status: true, appointmentDate: true, encounterNumber: true },
  },
  consentSignatures: {
    select: { id: true, consentFormId: true, signedAt: true, signatureType: true },
  },
  _count: { select: { documents: true, consentSignatures: true } },
};

function normalizePhone(value) {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
}

function parseIdList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickPatientData(data) {
  const payload = {};
  for (const key of PATIENT_WRITABLE_FIELDS) {
    if (data[key] !== undefined) {
      payload[key] = data[key];
    }
  }
  if (payload.dateOfBirth) payload.dateOfBirth = new Date(payload.dateOfBirth);
  if (payload.guarantorDateOfBirth) payload.guarantorDateOfBirth = new Date(payload.guarantorDateOfBirth);
  if (payload.profilePhoto === '') payload.profilePhoto = null;
  if (payload.country === '' || payload.country == null) payload.country = 'US';
  if (payload.billingType === 'self-pay') payload.billingType = 'self_pay';
  if (payload.registrationChannel) payload.registrationChannel = String(payload.registrationChannel).trim();
  if (Array.isArray(payload.disabilities)) {
    payload.disabilities = payload.disabilities.length ? JSON.stringify(payload.disabilities) : null;
  }
  if (Array.isArray(payload.interpreterLanguages)) {
    payload.interpreterLanguages = payload.interpreterLanguages.length
      ? JSON.stringify(payload.interpreterLanguages)
      : null;
  }
  if (Array.isArray(payload.accessibilityRequirements)) {
    payload.accessibilityRequirements = payload.accessibilityRequirements.length
      ? JSON.stringify(payload.accessibilityRequirements)
      : null;
  }
  return payload;
}

function toOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapInsuranceEntry(entry) {
  const insuranceType = (entry.insuranceTypeKey || entry.insuranceType || 'primary')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '_');
  const normalizedType = insuranceType.includes('secondary')
    ? 'secondary'
    : insuranceType.includes('tertiary')
      ? 'tertiary'
      : 'primary';

  return {
    insuranceType: normalizedType,
    insuranceProviderId: entry.insuranceProviderId || entry.insuranceCompany || entry.payerId,
    memberId: String(entry.memberId || entry.policyNumber || '').trim(),
    policyType: entry.policyType || null,
    planName: entry.planName || null,
    groupNumber: entry.groupNumber || null,
    subscriberFirstName: entry.subscriberFirstName || entry.subscriberName?.split(' ')?.[0] || null,
    subscriberLastName: entry.subscriberLastName || null,
    subscriberRelationship: entry.subscriberRelationship || entry.relationshipToPatient || null,
    subscriberGender: entry.subscriberGender || null,
    subscriberDateOfBirth: entry.subscriberDateOfBirth ? new Date(entry.subscriberDateOfBirth) : null,
    subscriberPhone: entry.subscriberPhone || null,
    subscriberEmail: entry.subscriberEmail || null,
    subscriberSsnLast4: entry.subscriberSsnLast4 || null,
    subscriberEmployer: entry.subscriberEmployer || null,
    subscriberStreetAddress: entry.subscriberStreetAddress || entry.subscriberAddress || null,
    subscriberCity: entry.subscriberCity || null,
    subscriberState: entry.subscriberState || null,
    subscriberZip: entry.subscriberZip || null,
    coverageStartDate: entry.coverageStartDate || entry.effectiveDate
      ? new Date(entry.coverageStartDate || entry.effectiveDate)
      : null,
    coverageEndDate: entry.coverageEndDate ? new Date(entry.coverageEndDate) : null,
    coinsurancePercentage: toOptionalNumber(entry.coinsurancePercentage),
    copay: toOptionalNumber(entry.copay),
    deductible: toOptionalNumber(entry.deductible),
    authorizationNumber:
      entry.authorizationRequired === 'no' ? null : entry.authorizationNumber || null,
  };
}

async function syncInsurances(patientId, insuranceList) {
  if (!Array.isArray(insuranceList)) return;

  await prisma.patientInsurance.deleteMany({ where: { patientId } });

  const rows = insuranceList
    .map(mapInsuranceEntry)
    .filter((row) => row.insuranceProviderId && row.memberId);

  if (!rows.length) return;

  await prisma.patientInsurance.createMany({
    data: rows.map((row) => ({ ...row, patientId })),
  });
}

async function syncDocuments(patientId, documents, userId) {
  if (!Array.isArray(documents)) return;

  await prisma.patientDocument.deleteMany({ where: { patientId } });

  const rows = documents
    .filter(
      (doc) =>
        doc &&
        (doc.documentType ||
          doc.type ||
          doc.documentCategory ||
          doc.documentName ||
          doc.fileData ||
          doc.dataUrl),
    )
    .map((doc) => {
      const title = doc.title || doc.documentName || doc.documentType || doc.type || 'Document';
      const documentType = doc.documentType || doc.type || doc.documentCategory || 'Other';
      return {
        patientId,
        title,
        documentType,
        category: doc.category || doc.documentCategory || 'Registration',
        source: doc.source || 'Registration',
        encounterId: doc.encounterId || null,
        description: doc.description || doc.documentNotes || null,
        documentDate: doc.documentDate ? new Date(doc.documentDate) : null,
        expirationDate: doc.documentExpirationDate || doc.expirationDate
          ? new Date(doc.documentExpirationDate || doc.expirationDate)
          : null,
        isConfidential: !!doc.isConfidential,
        patientVisible: !!doc.patientVisible,
        tags: Array.isArray(doc.tags) ? doc.tags : null,
        status: doc.status || 'Active',
        fileName: doc.fileName || doc.name || null,
        fileData: doc.fileData || doc.dataUrl || null,
        mimeType: doc.mimeType || null,
        fileSize: doc.fileSize || null,
        uploadedBy: userId || null,
      };
    });

  if (rows.length) {
    await prisma.patientDocument.createMany({ data: rows });
  }
}

const DOCUMENT_LISTABLE_STATUSES = ['Active', 'Expired', 'Archived', 'Pending Review', 'Verified'];

function inferDocumentStatus(doc) {
  if (doc.status && doc.status !== 'Active') return doc.status;
  if (doc.expirationDate && new Date(doc.expirationDate) < new Date()) return 'Expired';
  return doc.status || 'Active';
}

function formatFileType(mimeType, fileName) {
  if (mimeType) {
    const parts = mimeType.split('/');
    if (parts[1]) return parts[1].toUpperCase();
  }
  const ext = fileName?.split('.').pop();
  return ext ? ext.toUpperCase() : '—';
}

function mapDocumentRow(doc, userMap) {
  const status = inferDocumentStatus(doc);
  return {
    id: doc.id,
    title: doc.title || doc.documentType || doc.fileName || 'Document',
    documentName: doc.title || doc.documentType || doc.fileName || 'Document',
    documentType: doc.documentType,
    category: doc.category || 'Other',
    source: doc.source || 'Patient Dashboard',
    encounterId: doc.encounterId,
    description: doc.description,
    documentDate: doc.documentDate,
    expirationDate: doc.expirationDate,
    isConfidential: doc.isConfidential,
    patientVisible: doc.patientVisible,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    status,
    fileName: doc.fileName,
    fileData: doc.fileData,
    mimeType: doc.mimeType,
    fileType: formatFileType(doc.mimeType, doc.fileName),
    fileSize: doc.fileSize,
    uploadedBy: doc.uploadedBy,
    uploadedByName: userMap.get(doc.uploadedBy) || 'System',
    updatedBy: doc.updatedBy,
    updatedByName: userMap.get(doc.updatedBy) || null,
    verifiedBy: doc.verifiedBy,
    verifiedByName: userMap.get(doc.verifiedBy) || null,
    verifiedAt: doc.verifiedAt,
    parentDocumentId: doc.parentDocumentId,
    versionNumber: doc.versionNumber || 1,
    replaceReason: doc.replaceReason,
    uploadedOn: doc.createdAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    isExpiringSoon:
      doc.expirationDate &&
      status === 'Active' &&
      new Date(doc.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
      new Date(doc.expirationDate) >= new Date(),
  };
}

function buildDocumentSummary(documents) {
  const summary = {
    total: documents.length,
    registration: 0,
    dashboard: 0,
    insurance: 0,
    consent: 0,
    clinical: 0,
  };

  documents.forEach((doc) => {
    const source = doc.source || '';
    const category = doc.category || '';
    if (source === 'Registration') summary.registration += 1;
    if (source === 'Patient Dashboard') summary.dashboard += 1;
    if (source === 'Insurance' || category === 'Insurance') summary.insurance += 1;
    if (source === 'Consent' || category === 'Consent') summary.consent += 1;
    if (
      source === 'Referral' ||
      category === 'Clinical' ||
      category === 'Referral' ||
      category === 'Lab' ||
      category === 'Imaging'
    ) {
      summary.clinical += 1;
    }
  });

  return summary;
}

async function resolveUserMap(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });
  return new Map(users.map((u) => [u.id, u.name || u.email]));
}

async function logDocumentActivity(patientId, action, doc, user, changes) {
  if (!user?.id) return;
  await logPatientActivity(
    patientId,
    {
      action,
      section: 'Documents',
      tabName: 'Documents',
      changes: changes || [
        {
          field: 'document',
          label: doc.title || doc.documentType || doc.fileName,
          previousValue: '—',
          newValue: doc.fileName || doc.title || '—',
        },
      ],
    },
    user,
  );
}

async function syncConsentSignatures(patientId, signatures, userId) {
  if (!Array.isArray(signatures)) return;

  await prisma.patientConsentSignature.deleteMany({ where: { patientId } });

  const rows = signatures
    .filter((sig) => sig && sig.consentFormId && sig.signatureData)
    .map((sig) => ({
      patientId,
      consentFormId: sig.consentFormId,
      signedByUserId: userId || null,
      signatureType: sig.signatureType || 'typed',
      signatureData: sig.signatureData,
      scrolledToEnd: !!sig.scrolledToEnd,
      nameMatched: !!sig.nameMatched,
    }));

  if (rows.length) {
    await prisma.patientConsentSignature.createMany({ data: rows });
  }
}

function hasRecordedConsentSignature(signature) {
  if (!signature?.consentFormId) return false;
  return !!(
    signature.signatureData ||
    signature.signedAt ||
    signature.id
  );
}

async function deriveMandatoryConsentsSigned(signatures) {
  const mandatoryIds = await consentFormService.getActiveMandatoryFormIds();
  if (!mandatoryIds.length) return true;
  if (!Array.isArray(signatures) || !signatures.length) return false;

  const signedIds = new Set(
    signatures
      .filter((signature) => hasRecordedConsentSignature(signature))
      .map((signature) => signature.consentFormId),
  );

  return mandatoryIds.every((id) => signedIds.has(id));
}

async function deriveRegistrationStatus(data) {
  // draft | pending | completed — client supplies final Completed; otherwise Pending unless Draft.
  if (data.registrationStatus === 'draft') return 'draft';
  if (data.registrationStatus === 'completed') return 'completed';
  return 'pending';
}

async function logPatientActivity(patientId, entry, user) {
  await prisma.patientActivityLog.create({
    data: {
      patientId,
      action: entry.action,
      section: entry.section || null,
      tabName: entry.tabName || null,
      userId: user?.id || null,
      userName: user?.name || user?.email || null,
      userRole: user?.role || null,
      changes: entry.changes || null,
    },
  });
}

async function assertPatientExists(id) {
  const existing = await prisma.patient.findFirst({
    where: { id, ...NOT_DELETED },
    select: { id: true },
  });
  if (!existing) {
    const err = new Error('Patient not found');
    err.statusCode = 404;
    throw err;
  }
}

function parseJsonField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializePatient(row) {
  if (!row) return null;

  const latestAppointment = row.appointments?.[0] || null;

  return {
    ...row,
    disabilities: parseJsonField(row.disabilities),
    interpreterLanguages: parseJsonField(row.interpreterLanguages),
    accessibilityRequirements: parseJsonField(row.accessibilityRequirements),
    insuranceList: (row.insurances || []).map((ins) => ({
      id: ins.id,
      insuranceTypeKey: ins.insuranceType,
      insuranceType: ins.insuranceType,
      insuranceProviderId: ins.insuranceProviderId,
      payerName: ins.insuranceProvider?.name,
      payerId: ins.insuranceProvider?.code,
      memberId: ins.memberId,
      policyNumber: ins.memberId,
      groupNumber: ins.groupNumber,
      planName: ins.planName,
      policyType: ins.policyType,
      copay: ins.copay != null ? Number(ins.copay) : null,
      authorizationNumber: ins.authorizationNumber || null,
      subscriberFirstName: ins.subscriberFirstName || null,
      subscriberLastName: ins.subscriberLastName || null,
      subscriberRelationship: ins.subscriberRelationship || null,
    })),
    appointmentStatus: latestAppointment?.status || null,
    consentSigned: row.consentFormSigned || (row.consentSignatures?.length > 0),
    assignedToName: row.assignedTo?.name || null,
    createdByName: row.creator?.name || null,
    updatedByName: row.updater?.name || null,
  };
}

const patientService = {
  async create(data, userId) {
    const insuranceList = data.insuranceList;
    const documents = data.documents;
    const consentSignatures = data.consentSignatures;

    const payload = pickPatientData(data);
    payload.deletedAt = null;
    payload.createdBy = userId || null;
    payload.updatedBy = userId || null;
    payload.consentFormSigned =
      (await deriveMandatoryConsentsSigned(consentSignatures)) || !!payload.consentFormSigned;
    payload.registrationStatus = await deriveRegistrationStatus(payload);

    let row;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        payload.mrn = await generateNextMrn();
        row = await prisma.patient.create({ data: payload });
        break;
      } catch (err) {
        const isMrnConflict =
          err.code === 'P2002' && Array.isArray(err.meta?.target) && err.meta.target.includes('mrn');
        if (!isMrnConflict || attempt === 4) throw err;
      }
    }

    await syncInsurances(row.id, insuranceList);
    await syncDocuments(row.id, documents, userId);
    await syncConsentSignatures(row.id, consentSignatures, userId);

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      await logPatientActivity(
        row.id,
        {
          action: 'Patient Created',
          section: 'Registration',
          tabName: 'Demographics',
          changes: [{ field: 'registration', label: 'Patient record', previousValue: '—', newValue: 'Created' }],
        },
        user,
      );
    }

    return this.findById(row.id);
  },

  async findAll(filters = {}) {
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const conditions = [NOT_DELETED];

    if (filters.search) {
      conditions.push({
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { mrn: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      });
    }

    if (filters.mrn) {
      conditions.push({ mrn: { contains: filters.mrn, mode: 'insensitive' } });
    }
    if (filters.firstName) {
      conditions.push({ firstName: { contains: filters.firstName, mode: 'insensitive' } });
    }
    if (filters.lastName) {
      conditions.push({ lastName: { contains: filters.lastName, mode: 'insensitive' } });
    }
    if (filters.gender) {
      conditions.push({ gender: filters.gender.toLowerCase() });
    }
    if (filters.registrationStatus) {
      conditions.push({ registrationStatus: filters.registrationStatus.toLowerCase() });
    }
    if (filters.dateFrom) {
      conditions.push({ createdAt: { gte: new Date(filters.dateFrom) } });
    }
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      conditions.push({ createdAt: { lte: end } });
    }
    if (filters.consentForm === 'signed') {
      conditions.push({ consentFormSigned: true });
    } else if (filters.consentForm === 'not_signed') {
      conditions.push({ consentFormSigned: false });
    }

    const providerIds = parseIdList(filters.providerIds);
    if (providerIds.length) {
      conditions.push({
        OR: [
          { primaryCareProviderId: { in: providerIds } },
          { appointments: { some: { providerId: { in: providerIds } } } },
        ],
      });
    }

    const payerIds = parseIdList(filters.insuranceProviderIds || filters.insurancePayerIds);
    if (payerIds.length) {
      conditions.push({
        OR: [
          { insuranceProviderId: { in: payerIds } },
          { insurances: { some: { insuranceProviderId: { in: payerIds } } } },
        ],
      });
    } else if (filters.insuranceProviderId) {
      conditions.push({
        OR: [
          { insuranceProviderId: filters.insuranceProviderId },
          { insurances: { some: { insuranceProviderId: filters.insuranceProviderId } } },
        ],
      });
    }

    if (filters.insuranceType) {
      conditions.push({
        insurances: { some: { insuranceType: filters.insuranceType.toLowerCase() } },
      });
    }

    if (filters.listTab === 'registration_queue') {
      // Registration Queue: all patients with Pending registration status.
      if (!filters.registrationStatus) {
        conditions.push({ registrationStatus: 'pending' });
      }
    } else if (filters.listTab === 'my_list' && filters.assignedToId) {
      conditions.push({ assignedToId: filters.assignedToId });
    }

    if (filters.departmentId) {
      conditions.push({
        OR: [
          { appointments: { some: { departmentId: filters.departmentId } } },
          { primaryCareProvider: { departmentId: filters.departmentId } },
          {
            primaryCareProvider: {
              departmentLinks: { some: { departmentId: filters.departmentId } },
            },
          },
        ],
      });
    }

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: listInclude,
      }),
      prisma.patient.count({ where }),
    ]);

    return {
      data: rows.map(serializePatient),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async findById(id) {
    const row = await prisma.patient.findFirst({
      where: { id, ...NOT_DELETED },
      include: {
        ...listInclude,
        documents: true,
        consentSignatures: {
          select: {
            id: true,
            consentFormId: true,
            signedAt: true,
            signatureType: true,
            signatureData: true,
          },
        },
      },
    });
    return serializePatient(row);
  },

  async findByMrn(mrn) {
    const row = await prisma.patient.findFirst({
      where: { mrn, ...NOT_DELETED },
      include: listInclude,
    });
    return serializePatient(row);
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }

    const insuranceList = data.insuranceList;
    const documents = data.documents;
    const consentSignatures = data.consentSignatures;

    const payload = pickPatientData(data);
    payload.updatedBy = userId || null;

    if (consentSignatures !== undefined) {
      payload.consentFormSigned = await deriveMandatoryConsentsSigned(consentSignatures);
    }

    if (
      payload.registrationStatus !== 'draft' &&
      (insuranceList !== undefined || consentSignatures !== undefined || payload.billingType || payload.registrationStatus)
    ) {
      payload.registrationStatus = await deriveRegistrationStatus({
        ...existing,
        ...payload,
      });
    }

    await prisma.patient.update({ where: { id }, data: payload });

    if (insuranceList !== undefined) await syncInsurances(id, insuranceList);
    if (documents !== undefined) await syncDocuments(id, documents, userId);
    if (consentSignatures !== undefined) await syncConsentSignatures(id, consentSignatures, userId);

    const changes = diffPatientFields(existing, payload, PATIENT_WRITABLE_FIELDS);
    if (changes.length && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const sections = [...new Set(changes.map((c) => c.section))];
      await logPatientActivity(
        id,
        {
          action: 'Patient Updated',
          section: sections.join(', '),
          tabName: changes[0]?.tabName || 'Patient',
          changes,
        },
        user,
      );
    }

    return this.findById(id);
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.patient.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId || null,
        updatedBy: userId || null,
      },
    });

    return { success: true };
  },

  async assignToMe(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.patient.update({
      where: { id },
      data: {
        assignedToId: userId,
        updatedBy: userId,
      },
    });

    return this.findById(id);
  },

  async checkDuplicates({ firstName, lastName, dateOfBirth, contactNumber, gender, excludeId }) {
    if (!firstName || !lastName || !dateOfBirth || !contactNumber || !gender) {
      return { duplicates: [], hasDuplicates: false };
    }

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return { duplicates: [], hasDuplicates: false };
    }

    const phoneNorm = normalizePhone(contactNumber);
    if (!phoneNorm) {
      return { duplicates: [], hasDuplicates: false };
    }

    const candidates = await prisma.patient.findMany({
      where: {
        ...NOT_DELETED,
        firstName: { equals: firstName.trim(), mode: 'insensitive' },
        lastName: { equals: lastName.trim(), mode: 'insensitive' },
        gender: { equals: String(gender).trim(), mode: 'insensitive' },
        dateOfBirth: dob,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: {
        id: true,
        mrn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        contactNumber: true,
        cellPhone: true,
        homePhone: true,
        workPhone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zip: true,
      },
      take: 10,
    });

    const duplicates = candidates.filter((p) => {
      const phones = [p.contactNumber, p.cellPhone, p.homePhone, p.workPhone]
        .map(normalizePhone)
        .filter(Boolean);
      return phones.includes(phoneNorm);
    });

    return {
      hasDuplicates: duplicates.length > 0,
      duplicates,
    };
  },

  async getEncounters(patientId) {
    await assertPatientExists(patientId);
    return appointmentService.findByPatientId(patientId);
  },

  async listDocuments(patientId, query = {}) {
    await assertPatientExists(patientId);

    const where = {
      patientId,
      deletedAt: null,
      status: { notIn: ['Deleted', 'Replaced'] },
    };

    if (!query.includeArchived) {
      where.status = { notIn: ['Deleted', 'Replaced', 'Archived'] };
    } else if (query.status) {
      where.status = query.status;
      delete where.status.notIn;
    }

    if (query.documentType) where.documentType = query.documentType;
    if (query.category) where.category = query.category;
    if (query.source) where.source = query.source;
    if (query.uploadedBy) where.uploadedBy = query.uploadedBy;
    if (query.encounterId) where.encounterId = query.encounterId;
    if (query.patientVisible !== undefined) where.patientVisible = query.patientVisible;
    if (query.confidential !== undefined) where.isConfidential = query.confidential;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const rows = await prisma.patientDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const userIds = rows.flatMap((r) => [r.uploadedBy, r.updatedBy, r.verifiedBy]);
    const userMap = await resolveUserMap(userIds);

    let documents = rows.map((doc) => mapDocumentRow(doc, userMap));

    if (query.search) {
      const term = query.search.toLowerCase();
      documents = documents.filter((doc) => {
        const haystack = [
          doc.title,
          doc.documentType,
          doc.category,
          doc.source,
          doc.uploadedByName,
          ...(doc.tags || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      });
    }

    if (query.status && !query.includeArchived) {
      documents = documents.filter((doc) => doc.status === query.status);
    }

    return {
      documents,
      summary: buildDocumentSummary(documents),
    };
  },

  async createDocument(patientId, data, userId) {
    await assertPatientExists(patientId);

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    const status =
      data.expirationDate && new Date(data.expirationDate) < new Date() ? 'Expired' : 'Active';

    const created = await prisma.patientDocument.create({
      data: {
        patientId,
        title: data.title,
        documentType: data.documentType,
        category: data.category,
        source: data.source || 'Patient Dashboard',
        encounterId: data.encounterId || null,
        description: data.description || null,
        documentDate: data.documentDate ? new Date(data.documentDate) : null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        isConfidential: !!data.isConfidential,
        patientVisible: !!data.patientVisible,
        tags: Array.isArray(data.tags) ? data.tags : null,
        status,
        fileName: data.fileName,
        fileData: data.fileData,
        mimeType: data.mimeType,
        fileSize: data.fileSize || null,
        uploadedBy: userId || null,
        updatedBy: userId || null,
      },
    });

    await logDocumentActivity(patientId, 'Document Uploaded', created, user);

    const userMap = await resolveUserMap([userId]);
    return mapDocumentRow(created, userMap);
  },

  async getDocumentVersions(patientId, documentId) {
    await assertPatientExists(patientId);
    const doc = await prisma.patientDocument.findFirst({
      where: { id: documentId, patientId },
    });
    if (!doc) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    const rootId = doc.parentDocumentId || doc.id;
    const versions = await prisma.patientDocument.findMany({
      where: {
        patientId,
        OR: [{ id: rootId }, { parentDocumentId: rootId }, { id: documentId }, { parentDocumentId: documentId }],
      },
      orderBy: { versionNumber: 'desc' },
    });

    const uniqueVersions = [...new Map(versions.map((v) => [v.id, v])).values()].sort(
      (a, b) => (b.versionNumber || 1) - (a.versionNumber || 1),
    );

    const userMap = await resolveUserMap(
      uniqueVersions.flatMap((v) => [v.uploadedBy, v.updatedBy]),
    );

    return uniqueVersions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber || 1,
      fileName: v.fileName,
      uploadedBy: v.uploadedBy,
      uploadedByName: userMap.get(v.uploadedBy) || 'System',
      uploadedOn: v.createdAt,
      replaceReason: v.replaceReason,
      status: inferDocumentStatus(v),
    }));
  },

  async replaceDocument(patientId, documentId, data, userId) {
    await assertPatientExists(patientId);
    const existing = await prisma.patientDocument.findFirst({
      where: { id: documentId, patientId, deletedAt: null },
    });
    if (!existing) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    const rootId = existing.parentDocumentId || existing.id;
    const nextVersion = (existing.versionNumber || 1) + 1;

    await prisma.patientDocument.update({
      where: { id: existing.id },
      data: { status: 'Replaced', updatedBy: userId || existing.updatedBy },
    });

    const created = await prisma.patientDocument.create({
      data: {
        patientId,
        title: existing.title,
        documentType: existing.documentType,
        category: existing.category,
        source: existing.source,
        encounterId: existing.encounterId,
        description: existing.description,
        documentDate: existing.documentDate,
        expirationDate: existing.expirationDate,
        isConfidential: existing.isConfidential,
        patientVisible: existing.patientVisible,
        tags: existing.tags || undefined,
        status: 'Active',
        fileName: data.fileName,
        fileData: data.fileData,
        mimeType: data.mimeType,
        fileSize: data.fileSize || null,
        uploadedBy: userId || existing.uploadedBy,
        updatedBy: userId || null,
        parentDocumentId: rootId,
        versionNumber: nextVersion,
        replaceReason: data.replaceReason || null,
      },
    });

    await logDocumentActivity(patientId, 'Document Replaced', created, user, [
      {
        field: 'document',
        label: existing.title || existing.fileName,
        previousValue: existing.fileName || '—',
        newValue: data.fileName,
      },
    ]);

    const userMap = await resolveUserMap([userId, existing.uploadedBy]);
    return mapDocumentRow(created, userMap);
  },

  async updateDocumentStatus(patientId, documentId, status, userId) {
    await assertPatientExists(patientId);
    const existing = await prisma.patientDocument.findFirst({
      where: { id: documentId, patientId, deletedAt: null },
    });
    if (!existing) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    const updateData = {
      status,
      updatedBy: userId || existing.updatedBy,
    };

    if (status === 'Verified') {
      updateData.verifiedBy = userId || null;
      updateData.verifiedAt = new Date();
    }

    const updated = await prisma.patientDocument.update({
      where: { id: documentId },
      data: updateData,
    });

    const action =
      status === 'Archived'
        ? 'Document Archived'
        : status === 'Verified'
          ? 'Document Marked as Verified'
          : 'Document Updated';

    await logDocumentActivity(patientId, action, updated, user, [
      {
        field: 'status',
        label: updated.title || updated.fileName,
        previousValue: existing.status,
        newValue: status,
      },
    ]);

    const userMap = await resolveUserMap([updated.uploadedBy, updated.updatedBy, updated.verifiedBy]);
    return mapDocumentRow(updated, userMap);
  },

  async logDocumentAudit(patientId, documentId, action, userId) {
    await assertPatientExists(patientId);
    const existing = await prisma.patientDocument.findFirst({
      where: { id: documentId, patientId },
    });
    if (!existing) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    const actionLabels = {
      viewed: existing.isConfidential ? 'Confidential Document Accessed' : 'Document Viewed',
      downloaded: 'Document Downloaded',
      printed: 'Document Printed',
    };

    await logDocumentActivity(
      patientId,
      actionLabels[action] || 'Document Accessed',
      existing,
      user,
      [
        {
          field: 'document',
          label: existing.title || existing.fileName,
          previousValue: '—',
          newValue: action,
        },
      ],
    );

    return { success: true };
  },

  async updateDocument(patientId, documentId, data, userId) {
    await assertPatientExists(patientId);
    const existing = await prisma.patientDocument.findFirst({
      where: { id: documentId, patientId, deletedAt: null },
    });
    if (!existing) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    const nextExpiration = data.expirationDate !== undefined
      ? data.expirationDate
        ? new Date(data.expirationDate)
        : null
      : existing.expirationDate;
    let nextStatus = data.status ?? existing.status;
    if (
      nextExpiration &&
      new Date(nextExpiration) < new Date() &&
      !['Archived', 'Deleted', 'Replaced'].includes(nextStatus)
    ) {
      nextStatus = 'Expired';
    }

    const updated = await prisma.patientDocument.update({
      where: { id: documentId },
      data: {
        title: data.title ?? data.documentName ?? existing.title,
        documentType: data.documentType ?? existing.documentType,
        category: data.category ?? existing.category,
        encounterId: data.encounterId !== undefined ? data.encounterId || null : existing.encounterId,
        description: data.description !== undefined ? data.description || null : existing.description,
        documentDate:
          data.documentDate !== undefined
            ? data.documentDate
              ? new Date(data.documentDate)
              : null
            : existing.documentDate,
        expirationDate: nextExpiration,
        isConfidential:
          data.isConfidential !== undefined ? !!data.isConfidential : existing.isConfidential,
        patientVisible:
          data.patientVisible !== undefined ? !!data.patientVisible : existing.patientVisible,
        tags: data.tags !== undefined ? data.tags : existing.tags,
        status: nextStatus,
        fileName: data.fileName ?? existing.fileName,
        fileData: data.fileData ?? existing.fileData,
        mimeType: data.mimeType ?? existing.mimeType,
        fileSize: data.fileSize ?? existing.fileSize,
        uploadedBy: data.fileData ? userId || existing.uploadedBy : existing.uploadedBy,
        updatedBy: userId || existing.updatedBy,
      },
    });

    await logDocumentActivity(patientId, 'Document Edited', updated, user, [
      {
        field: 'document',
        label: updated.title || updated.fileName,
        previousValue: existing.fileName || '—',
        newValue: updated.fileName || '—',
      },
    ]);

    const userMap = await resolveUserMap([updated.uploadedBy, updated.updatedBy, updated.verifiedBy]);
    return mapDocumentRow(updated, userMap);
  },

  async deleteDocument(patientId, documentId, userId) {
    await assertPatientExists(patientId);
    const existing = await prisma.patientDocument.findFirst({
      where: { id: documentId, patientId, deletedAt: null },
    });
    if (!existing) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

    await prisma.patientDocument.update({
      where: { id: documentId },
      data: {
        status: 'Deleted',
        deletedAt: new Date(),
        updatedBy: userId || existing.updatedBy,
      },
    });

    await logDocumentActivity(patientId, 'Document Deleted', existing, user, [
      {
        field: 'document',
        label: existing.title || existing.fileName,
        previousValue: existing.fileName || '—',
        newValue: 'Deleted',
      },
    ]);

    return { success: true };
  },

  async getTimeline(patientId) {
    await assertPatientExists(patientId);
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, ...NOT_DELETED },
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
        updater: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    const [activityLogs, appointments, documents] = await Promise.all([
      prisma.patientActivityLog.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.appointment.findMany({
        where: { patientId },
        select: { id: true, encounterNumber: true, createdAt: true, status: true },
      }),
      prisma.patientDocument.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, documentType: true, fileName: true, createdAt: true, uploadedBy: true },
      }),
    ]);

    const appointmentIds = appointments.map((a) => a.id);
    const appointmentHistory = appointmentIds.length
      ? await prisma.appointmentHistory.findMany({
          where: { appointmentId: { in: appointmentIds } },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const events = [];

    if (patient?.createdAt) {
      events.push({
        id: `created-${patient.id}`,
        action: 'Patient Created',
        userName: patient.creator?.name || patient.creator?.email || 'System',
        userRole: patient.creator?.role || null,
        dateTime: patient.createdAt,
        section: 'Registration',
        tabName: 'Demographics',
        changes: [],
      });
    }

    for (const log of activityLogs) {
      events.push({
        id: log.id,
        action: log.action,
        userName: log.userName || 'System',
        userRole: log.userRole || null,
        dateTime: log.createdAt,
        section: log.section,
        tabName: log.tabName,
        changes: Array.isArray(log.changes) ? log.changes : [],
      });
    }

    for (const doc of documents) {
      events.push({
        id: `doc-${doc.id}`,
        action: 'Document Uploaded',
        userName: 'System',
        userRole: null,
        dateTime: doc.createdAt,
        section: 'Documents',
        tabName: 'Documents',
        changes: [
          {
            field: 'document',
            label: doc.documentType || doc.fileName,
            previousValue: '—',
            newValue: doc.fileName || 'Uploaded',
          },
        ],
      });
    }

    for (const hist of appointmentHistory) {
      events.push({
        id: `appt-hist-${hist.id}`,
        action: hist.action || 'Encounter Updated',
        userName: hist.changedByName || 'System',
        userRole: null,
        dateTime: hist.createdAt,
        section: 'Encounter',
        tabName: 'Appointment',
        changes: Array.isArray(hist.changes) ? hist.changes : [],
        summary: hist.summary,
      });
    }

    events.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    return events;
  },

  async deleteWithConfirmation(id, { firstName, middleName, lastName }, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }

    const norm = (v) => (v || '').trim().toLowerCase();
    if (
      norm(firstName) !== norm(existing.firstName) ||
      norm(middleName) !== norm(existing.middleName) ||
      norm(lastName) !== norm(existing.lastName)
    ) {
      const err = new Error('Patient name confirmation does not match the record');
      err.statusCode = 400;
      throw err;
    }

    return this.delete(id, userId);
  },

  async getSummary(patientId, { encounterId } = {}) {
    await assertPatientExists(patientId);

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, ...NOT_DELETED },
      select: { id: true, mrn: true, noKnownDrugAllergies: true },
    });

    const appointmentInclude = {
      providerRef: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          specialty: { select: { name: true } },
        },
      },
      departmentRef: { select: { id: true, departmentName: true, facilityName: true } },
      appointmentTypeRef: { select: { id: true, name: true } },
    };

    const formatProviderName = (appointment) => {
      if (appointment?.providerRef) {
        const parts = [
          appointment.providerRef.firstName,
          appointment.providerRef.middleName,
          appointment.providerRef.lastName,
        ].filter(Boolean);
        if (parts.length) return parts.join(' ');
      }
      return appointment?.provider?.trim() || null;
    };

    const formatVisitLocation = (appointment) => {
      if (!appointment) return null;
      return (
        appointment.departmentRef?.facilityName ||
        appointment.departmentRef?.departmentName ||
        appointment.department ||
        null
      );
    };

    const serializeVisit = (appointment) => {
      if (!appointment) return null;
      const date =
        appointment.appointmentDate instanceof Date
          ? appointment.appointmentDate.toISOString().slice(0, 10)
          : String(appointment.appointmentDate).slice(0, 10);
      return {
        encounterId: appointment.id,
        encounterDate: date,
        appointmentDate: date,
        appointmentTime: appointment.appointmentTime,
        visitType: appointment.appointmentTypeRef?.name || 'Visit',
        providerName: formatProviderName(appointment),
        location: formatVisitLocation(appointment),
        status: appointment.status,
      };
    };

    let currentEncounter = null;
    if (encounterId) {
      currentEncounter = await prisma.appointment.findFirst({
        where: { id: encounterId, patientId },
        include: appointmentInclude,
      });
    }

    if (!currentEncounter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const openStatuses = [
        'Scheduled',
        'Checked In',
        'Checked-In',
        'In Progress',
        'In Intake',
        'With Provider',
        'Provider Out',
        'Rescheduled',
      ];
      const candidates = await prisma.appointment.findMany({
        where: { patientId, status: { in: openStatuses } },
        orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
        include: appointmentInclude,
      });
      const todayStr = today.toISOString().slice(0, 10);
      currentEncounter =
        candidates.find((a) => {
          const d =
            a.appointmentDate instanceof Date
              ? a.appointmentDate.toISOString().slice(0, 10)
              : String(a.appointmentDate).slice(0, 10);
          return d === todayStr;
        }) ||
        candidates[0] ||
        null;
    }

    const chiefComplaint = currentEncounter?.visitReason?.trim() || null;

    const lastVisitWhere = {
      patientId,
      status: 'Completed',
    };
    if (currentEncounter) {
      lastVisitWhere.AND = [
        {
          OR: [
            { appointmentDate: { lt: currentEncounter.appointmentDate } },
            {
              appointmentDate: currentEncounter.appointmentDate,
              id: { not: currentEncounter.id },
            },
          ],
        },
      ];
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [lastVisitRow, upcomingVisitRow, eligibilityRow, problems, allergies, orders] =
      await Promise.all([
        prisma.appointment.findFirst({
          where: lastVisitWhere,
          orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'desc' }],
          include: appointmentInclude,
        }),
        prisma.appointment.findFirst({
          where: {
            patientId,
            status: 'Scheduled',
            appointmentDate: { gt: todayStart },
          },
          orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
          include: appointmentInclude,
        }),
        prisma.insuranceEligibilityVerification.findFirst({
          where: { patientId },
          orderBy: { verifiedAt: 'desc' },
        }),
        prisma.patientProblem.findMany({
          where: { patientId, deletedAt: null },
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        }),
        prisma.patientAllergy.findMany({
          where: { patientId },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.findMany({
          where: {
            patientId,
            ...(currentEncounter ? { appointmentId: currentEncounter.id } : {}),
          },
          orderBy: { orderDateTime: 'desc' },
        }),
      ]);

    const providerName = formatProviderName(currentEncounter);
    const providerSpecialty = currentEncounter?.providerRef?.specialty?.name || null;

    return {
      patientId: patient.id,
      mrn: patient.mrn,
      currentEncounterId: currentEncounter?.id || null,
      chiefComplaint,
      lastVisit: serializeVisit(lastVisitRow),
      upcomingVisit: serializeVisit(upcomingVisitRow),
      provider: providerName
        ? { name: providerName, specialty: providerSpecialty }
        : null,
      insuranceEligibilityStatus: eligibilityRow?.status || null,
      noKnownDrugAllergies: patient.noKnownDrugAllergies,
      problems: problems.map((p) => ({
        id: p.id,
        diagnosisId: p.diagnosisId,
        icd10Code: p.icd10Code,
        diagnosisDescription: p.diagnosisDescription,
        problemCode: p.icd10Code,
        problemDescription: p.diagnosisDescription,
        status: p.status,
        clinicalStatus: p.clinicalStatus,
        verificationStatus: p.verificationStatus,
        verification: p.verificationStatus,
        onsetDate: p.onsetDate,
        resolvedDate: p.resolvedDate,
      })),
      allergies: allergies.map((a) => ({
        id: a.id,
        allergenName: a.allergenName,
        reaction: a.reaction,
        severity: a.severity,
        onsetDate: a.onsetDate,
        status: a.status,
        comment: a.comment,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        orderName: o.procedureName,
        orderType: o.category,
        orderStatus: o.status,
        orderedBy: o.orderedBy,
        orderedDate: o.orderDateTime,
        priority: 'Routine',
      })),
    };
  },
};

module.exports = patientService;
