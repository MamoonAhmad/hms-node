const prisma = require('../lib/prisma');

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
];

function pickPatientData(data) {
  const payload = {};
  for (const key of PATIENT_WRITABLE_FIELDS) {
    if (data[key] !== undefined) {
      payload[key] = data[key];
    }
  }
  if (payload.dateOfBirth) {
    payload.dateOfBirth = new Date(payload.dateOfBirth);
  }
  if (payload.guarantorDateOfBirth) {
    payload.guarantorDateOfBirth = new Date(payload.guarantorDateOfBirth);
  }
  if (payload.profilePhoto === '') {
    payload.profilePhoto = null;
  }
  if (payload.country === '' || payload.country == null) {
    payload.country = 'US';
  }
  return payload;
}

const patientService = {
  /**
   * Create a new patient
   */
  async create(data) {
    return prisma.patient.create({
      data: pickPatientData(data),
      include: {
        insuranceProvider: true,
      },
    });
  },

  /**
   * Get all patients with optional pagination and filters
   */
  async findAll({ page = 1, limit = 10, search = '', gender, insuranceProviderId }) {
    const skip = (page - 1) * parseInt(limit);

    const where = {};
    const conditions = [];

    if (search) {
      conditions.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { mrn: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (gender) {
      conditions.push({ gender });
    }

    if (insuranceProviderId) {
      conditions.push({ insuranceProviderId });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit) || 10,
        orderBy: { createdAt: 'desc' },
        include: {
          insuranceProvider: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  /**
   * Get a patient by ID
   */
  async findById(id) {
    return prisma.patient.findUnique({
      where: { id },
      include: {
        insuranceProvider: true,
      },
    });
  },

  /**
   * Get a patient by MRN
   */
  async findByMrn(mrn) {
    return prisma.patient.findUnique({
      where: { mrn },
      include: {
        insuranceProvider: true,
      },
    });
  },

  /**
   * Update a patient
   */
  async update(id, data) {
    return prisma.patient.update({
      where: { id },
      data: pickPatientData(data),
      include: {
        insuranceProvider: true,
      },
    });
  },

  /**
   * Delete a patient
   */
  async delete(id) {
    return prisma.patient.delete({
      where: { id },
    });
  },
};

module.exports = patientService;
