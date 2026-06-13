const prisma = require('../lib/prisma');

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
  return payload;
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
    coinsurancePercentage: entry.coinsurancePercentage != null ? entry.coinsurancePercentage : null,
    copay: entry.copay != null ? entry.copay : null,
    deductible: entry.deductible != null ? entry.deductible : null,
    authorizationNumber: entry.authorizationNumber || null,
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
    .filter((doc) => doc && (doc.documentType || doc.type))
    .map((doc) => ({
      patientId,
      documentType: doc.documentType || doc.type,
      fileName: doc.fileName || doc.name || null,
      fileData: doc.fileData || doc.dataUrl || null,
      mimeType: doc.mimeType || null,
      uploadedBy: userId || null,
    }));

  if (rows.length) {
    await prisma.patientDocument.createMany({ data: rows });
  }
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

function deriveConsentSigned(signatures) {
  return Array.isArray(signatures) && signatures.some((s) => s?.signatureData);
}

function deriveRegistrationStatus(data, insuranceList, signatures) {
  if (data.registrationStatus === 'draft') return 'draft';

  const billingType = data.billingType === 'self-pay' ? 'self_pay' : data.billingType;
  const hasConsents = deriveConsentSigned(signatures) || data.consentFormSigned;

  if (billingType === 'self_pay') {
    return hasConsents ? 'completed' : 'pending';
  }

  if (billingType === 'insurance') {
    const validInsurances = (insuranceList || [])
      .map(mapInsuranceEntry)
      .filter((row) => row.insuranceProviderId && row.memberId);
    if (validInsurances.length && hasConsents) return 'completed';
    return 'pending';
  }

  return data.registrationStatus || 'pending';
}

function serializePatient(row) {
  if (!row) return null;

  const latestAppointment = row.appointments?.[0] || null;

  return {
    ...row,
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
    payload.consentFormSigned = deriveConsentSigned(consentSignatures) || !!payload.consentFormSigned;
    payload.registrationStatus = deriveRegistrationStatus(payload, insuranceList, consentSignatures);

    const row = await prisma.patient.create({ data: payload });

    await syncInsurances(row.id, insuranceList);
    await syncDocuments(row.id, documents, userId);
    await syncConsentSignatures(row.id, consentSignatures, userId);

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

    if (filters.listTab === 'draft') {
      conditions.push({ registrationStatus: 'draft' });
    } else if (filters.listTab === 'my_list' && filters.assignedToId) {
      conditions.push({ assignedToId: filters.assignedToId });
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
      payload.consentFormSigned = deriveConsentSigned(consentSignatures);
    }

    if (
      payload.registrationStatus !== 'draft' &&
      (insuranceList !== undefined || consentSignatures !== undefined || payload.billingType)
    ) {
      payload.registrationStatus = deriveRegistrationStatus(
        { ...existing, ...payload },
        insuranceList !== undefined ? insuranceList : existing.insuranceList,
        consentSignatures,
      );
    }

    await prisma.patient.update({ where: { id }, data: payload });

    if (insuranceList !== undefined) await syncInsurances(id, insuranceList);
    if (documents !== undefined) await syncDocuments(id, documents, userId);
    if (consentSignatures !== undefined) await syncConsentSignatures(id, consentSignatures, userId);

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

  async checkDuplicates({ firstName, lastName, dateOfBirth, contactNumber, address, excludeId }) {
    if (!firstName || !lastName || !dateOfBirth) {
      return { duplicates: [], hasDuplicates: false };
    }

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return { duplicates: [], hasDuplicates: false };
    }

    const phoneNorm = normalizePhone(contactNumber);
    const addressNorm = (address || '').trim().toLowerCase();

    const candidates = await prisma.patient.findMany({
      where: {
        ...NOT_DELETED,
        firstName: { equals: firstName.trim(), mode: 'insensitive' },
        lastName: { equals: lastName.trim(), mode: 'insensitive' },
        dateOfBirth: dob,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: {
        id: true,
        mrn: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        contactNumber: true,
        address: true,
      },
      take: 10,
    });

    const duplicates = candidates.filter((p) => {
      const phoneMatch = phoneNorm && normalizePhone(p.contactNumber) === phoneNorm;
      const addressMatch =
        addressNorm && (p.address || '').trim().toLowerCase() === addressNorm;
      return phoneMatch && addressMatch;
    });

    return {
      hasDuplicates: duplicates.length > 0,
      duplicates,
    };
  },
};

module.exports = patientService;
