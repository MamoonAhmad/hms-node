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
  'noEmail',
  'noEmailReason',
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
  'veteranStatusDetail',
  'disabilityStatus',
  'disabilityType',
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
  'prefix',
  'ssnLast4',
  'county',
  'mailingSameAsResidential',
  'mailingAddress',
  'mailingAddressLine2',
  'mailingCity',
  'mailingState',
  'mailingZip',
  'mailingCountry',
  'governmentIdState',
  'governmentIdExpiration',
  'medicareBeneficiaryId',
  'medicaidId',
  'preferredPharmacyName',
  'preferredPharmacyPhone',
  'preferredPharmacyAddress',
  'smsOptIn',
  'emailOptIn',
  'reminderOptIn',
  'hipaaRoiName',
  'hipaaRoiRelationship',
  'hipaaRoiPhone',
  'hipaaRoiEmail',
  'advanceDirectiveOnFile',
  'advanceDirectiveType',
  'powerOfAttorneyName',
  'powerOfAttorneyPhone',
  'workersCompClaimNumber',
  'autoAccidentClaimNumber',
  'billingNotes',
  'accountBalance',
  'referredBy',
  'countryOther',
  'languageOther',
  'allergyNotes',
  'noKnownDrugAllergies',
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
  'chartStatus',
  'deceasedAt',
  'financialClass',
  'lastStatementAt',
  'lastEligibilityAt',
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
  if (payload.governmentIdExpiration) payload.governmentIdExpiration = new Date(payload.governmentIdExpiration);
  if (payload.deceasedAt) payload.deceasedAt = new Date(payload.deceasedAt);
  if (payload.profilePhoto === '') payload.profilePhoto = null;
  if (payload.country === '' || payload.country == null) payload.country = 'US';
  if (payload.billingType === 'self-pay') payload.billingType = 'self_pay';
  if (payload.registrationChannel) payload.registrationChannel = String(payload.registrationChannel).trim();
  if (payload.ssnLast4) payload.ssnLast4 = String(payload.ssnLast4).replace(/\D/g, '').slice(0, 4);
  if (payload.mailingSameAsResidential) {
    payload.mailingAddress = payload.address || payload.mailingAddress || null;
    payload.mailingAddressLine2 = payload.addressLine2 || payload.mailingAddressLine2 || null;
    payload.mailingCity = payload.city || payload.mailingCity || null;
    payload.mailingState = payload.state || payload.mailingState || null;
    payload.mailingZip = payload.zip || payload.mailingZip || null;
  }
  // Avoid FK failures from empty / non-UUID related ids
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (payload.insuranceProviderId && !uuidRe.test(String(payload.insuranceProviderId))) {
    payload.insuranceProviderId = null;
  }
  if (payload.primaryCareProviderId && !uuidRe.test(String(payload.primaryCareProviderId))) {
    payload.primaryCareProviderId = null;
  }
  if (payload.assignedToId && !uuidRe.test(String(payload.assignedToId))) {
    payload.assignedToId = null;
  }
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
    authorizationRequired: entry.authorizationRequired || null,
    claimNumber: entry.claimNumber || entry.workersCompClaimNumber || entry.autoAccidentClaimNumber || null,
    isActive: entry.isActive !== false,
    cobOrder:
      entry.cobOrder != null
        ? parseInt(entry.cobOrder, 10)
        : normalizedType === 'secondary'
          ? 2
          : normalizedType === 'tertiary'
            ? 3
            : 1,
    notes: entry.notes || null,
  };
}

async function syncInsurances(patientId, insuranceList) {
  if (!Array.isArray(insuranceList)) return;

  await prisma.patientInsurance.deleteMany({ where: { patientId } });

  const rows = insuranceList
    .map(mapInsuranceEntry)
    .filter((row) => row.insuranceProviderId && row.memberId);

  if (!rows.length) return;

  const providerIds = [...new Set(rows.map((row) => row.insuranceProviderId))];
  const existingProviders = await prisma.insuranceProvider.findMany({
    where: { id: { in: providerIds }, deletedAt: null },
    select: { id: true },
  });
  const validProviderIds = new Set(existingProviders.map((p) => p.id));
  const validRows = rows.filter((row) => validProviderIds.has(row.insuranceProviderId));
  if (!validRows.length) return;

  await prisma.patientInsurance.createMany({
    data: validRows.map((row) => ({ ...row, patientId })),
  });
}

async function syncDocuments(patientId, documents, userId) {
  if (!Array.isArray(documents)) return;

  await prisma.patientDocument.deleteMany({ where: { patientId } });

  const rows = documents
    .filter((doc) => doc && (doc.documentType || doc.type || doc.documentCategory || doc.requiredDocumentType))
    .map((doc) => ({
      patientId,
      documentType: doc.documentType || doc.type || doc.documentCategory || doc.requiredDocumentType || 'Other',
      documentName: doc.documentName || doc.name || null,
      fileName: doc.fileName || doc.name || null,
      fileData: doc.fileData || doc.dataUrl || null,
      mimeType: doc.mimeType || null,
      documentNotes: doc.documentNotes || null,
      expirationDate: doc.documentExpirationDate || doc.expirationDate
        ? new Date(doc.documentExpirationDate || doc.expirationDate)
        : null,
      governmentIdType: doc.governmentIdType || null,
      insuranceCardSide: doc.insuranceCardSide || null,
      uploadedBy: userId || null,
    }));

  if (rows.length) {
    await prisma.patientDocument.createMany({ data: rows });
  }
}

async function syncConsentSignatures(patientId, signatures, userId) {
  if (!Array.isArray(signatures)) return;

  await prisma.patientConsentSignature.deleteMany({ where: { patientId } });

  const candidates = signatures.filter((sig) => sig && sig.consentFormId && sig.signatureData);
  if (!candidates.length) return;

  const formIds = [...new Set(candidates.map((sig) => String(sig.consentFormId)))];
  const existingForms = await prisma.consentForm.findMany({
    where: { id: { in: formIds }, deletedAt: null },
    select: { id: true },
  });
  const validFormIds = new Set(existingForms.map((f) => f.id));

  const rows = candidates
    .filter((sig) => validFormIds.has(String(sig.consentFormId)))
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

const DEFAULT_REGISTRATION_CONSENT_TYPES = [
  'general-treatment',
  'hipaa-privacy',
  'financial-responsibility',
  'telehealth',
  'release-of-information',
];

const DEFAULT_REGISTRATION_CONSENT_FORMS = [
  {
    consentType: 'general-treatment',
    consentTitle: 'Consent for Treatment (Outpatient)',
    description: 'General',
    consentContent:
      'I authorize the outpatient clinic to provide evaluation and treatment that is considered necessary for my care, including routine examinations, diagnostic procedures, and standard therapeutic services. I understand that no guarantees have been made about the results of treatment.',
  },
  {
    consentType: 'hipaa-privacy',
    consentTitle: 'Notice of Privacy Practices Acknowledgement (HIPAA)',
    description: 'Privacy',
    consentContent:
      'I acknowledge that I have been offered access to the clinic’s Notice of Privacy Practices and understand how my health information may be used and disclosed.',
  },
  {
    consentType: 'financial-responsibility',
    consentTitle: 'Financial Responsibility Agreement',
    description: 'Billing',
    consentContent:
      'I agree to be financially responsible for charges not covered by my insurance, including copays, deductibles, coinsurance, and non-covered services. I authorize the clinic to bill my insurance and receive payment on my behalf.',
  },
  {
    consentType: 'telehealth',
    consentTitle: 'Telehealth Consent',
    description: 'Telehealth',
    consentContent:
      'I consent to receive healthcare services via telehealth, which may include audio, video, or other electronic communications. I understand telehealth has limitations and an in-person visit may be recommended when needed.',
  },
  {
    consentType: 'release-of-information',
    consentTitle: 'Authorization to Release Medical Information',
    description: 'Records',
    consentContent:
      'I authorize the clinic to release my medical information as needed for treatment, payment, and healthcare operations, and to designated entities involved in my care.',
  },
];

async function resolveConsentActorId(userId) {
  if (userId) return userId;
  const existing = await prisma.user.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  return existing?.id || null;
}

async function ensureDefaultRegistrationConsentForms(userId) {
  const actorId = await resolveConsentActorId(userId);
  if (!actorId) return;

  const existing = await prisma.consentForm.findMany({
    where: {
      deletedAt: null,
      consentType: { in: DEFAULT_REGISTRATION_CONSENT_TYPES },
    },
    select: { consentType: true },
  });
  const have = new Set(existing.map((row) => row.consentType));
  const missing = DEFAULT_REGISTRATION_CONSENT_FORMS.filter((form) => !have.has(form.consentType));
  if (!missing.length) return;

  await prisma.consentForm.createMany({
    data: missing.map((form) => ({
      ...form,
      status: 'active',
      isMandatory: true,
      isSignatureRequired: true,
      versionNumber: '1.0',
      createdBy: actorId,
      updatedBy: actorId,
    })),
  });
}

const VISIT_TYPE_TO_APPOINTMENT_TYPE = {
  'new-patient': 'New',
  'follow-up': 'Follow-up',
  urgent: 'New',
  telehealth: 'Televisit',
  procedure: 'New',
  general: 'New',
};

async function maybeCreateRegistrationAppointment(patientId, data, userId) {
  const appointmentDate = data.appointmentDate;
  const appointmentTime = data.appointmentTime || data.appointmentStartTime;
  if (!appointmentDate || !appointmentTime) return;
  if (data.bookAppointment === false) return;

  try {
    const appointmentService = require('./appointment.service');
    const appointmentType =
      VISIT_TYPE_TO_APPOINTMENT_TYPE[data.appointmentVisitType] ||
      data.appointmentVisitType ||
      'New';
    await appointmentService.create(
      {
        patientId,
        appointmentDate,
        appointmentTime,
        appointmentEndTime: data.appointmentEndTime || null,
        appointmentType,
        visitReason: data.appointmentReason || null,
        department: data.appointmentDepartment || null,
        departmentId: data.appointmentDepartmentId || null,
        provider: data.appointmentProvider || null,
        providerId: data.appointmentProviderId || null,
        status: data.status || 'Scheduled',
        notes: data.appointmentNotes || null,
      },
      { id: userId },
    );
  } catch (error) {
    console.error('Registration appointment create failed:', error?.message || error);
  }
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
      insuranceCompany: ins.insuranceProviderId,
      payerName: ins.insuranceProvider?.name,
      payerId: ins.insuranceProvider?.code,
      memberId: ins.memberId,
      policyNumber: ins.memberId,
      groupNumber: ins.groupNumber,
      planName: ins.planName,
      policyType: ins.policyType,
      subscriberFirstName: ins.subscriberFirstName,
      subscriberLastName: ins.subscriberLastName,
      subscriberRelationship: ins.subscriberRelationship,
      subscriberGender: ins.subscriberGender,
      subscriberDateOfBirth: ins.subscriberDateOfBirth,
      subscriberPhone: ins.subscriberPhone,
      subscriberEmail: ins.subscriberEmail,
      subscriberSsnLast4: ins.subscriberSsnLast4,
      subscriberEmployer: ins.subscriberEmployer,
      subscriberAddress: ins.subscriberStreetAddress,
      subscriberCity: ins.subscriberCity,
      subscriberState: ins.subscriberState,
      subscriberZip: ins.subscriberZip,
      coverageStartDate: ins.coverageStartDate,
      coverageEndDate: ins.coverageEndDate,
      copay: ins.copay,
      deductible: ins.deductible,
      coinsurancePercentage: ins.coinsurancePercentage,
      authorizationNumber: ins.authorizationNumber,
      authorizationRequired: ins.authorizationRequired,
      claimNumber: ins.claimNumber,
    })),
    documents: (row.documents || []).map((doc) => ({
      id: doc.id,
      documentType: doc.documentType,
      documentCategory: doc.documentType,
      documentName: doc.documentName || doc.fileName,
      fileName: doc.fileName,
      fileData: doc.fileData,
      mimeType: doc.mimeType,
      documentNotes: doc.documentNotes,
      documentExpirationDate: doc.expirationDate,
      governmentIdType: doc.governmentIdType,
      insuranceCardSide: doc.insuranceCardSide,
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

    try {
      await syncInsurances(row.id, insuranceList);
      await syncDocuments(row.id, documents, userId);
      await syncConsentSignatures(row.id, consentSignatures, userId);
      await maybeCreateRegistrationAppointment(row.id, data, userId);
    } catch (syncError) {
      // Patient row is already persisted; do not fail the whole create on related-data sync.
      console.error('Patient related-data sync failed after create:', syncError);
    }

    return this.findById(row.id);
  },

  async listRegistrationConsentForms(userId) {
    await ensureDefaultRegistrationConsentForms(userId);
    const forms = await prisma.consentForm.findMany({
      where: {
        deletedAt: null,
        status: 'active',
        consentType: { in: DEFAULT_REGISTRATION_CONSENT_TYPES },
      },
      orderBy: { consentTitle: 'asc' },
      select: {
        id: true,
        consentTitle: true,
        consentType: true,
        description: true,
        consentContent: true,
        versionNumber: true,
        isMandatory: true,
        isSignatureRequired: true,
      },
    });
    return forms;
  },

  async findAll(filters = {}) {
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const conditions = [NOT_DELETED];

    if (filters.search) {
      const term = String(filters.search).trim();
      const searchOr = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { mrn: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { contactNumber: { contains: term, mode: 'insensitive' } },
        { cellPhone: { contains: term, mode: 'insensitive' } },
        { homePhone: { contains: term, mode: 'insensitive' } },
        { governmentIdNumber: { contains: term, mode: 'insensitive' } },
      ];
      if (/^[0-9a-f-]{8,}$/i.test(term)) {
        searchOr.push({ id: term });
      }
      conditions.push({ OR: searchOr });
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
