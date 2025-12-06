const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

const patientService = {
  /**
   * Create a new patient
   */
  async create(data) {
    return prisma.patient.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        contactNumber: data.contactNumber,
        email: data.email,
        address: data.address,
        insuranceProvider: data.insuranceProvider,
        policyNumber: data.policyNumber,
        copay: data.copay,
        deductible: data.deductible,
        primaryCarePhysician: data.primaryCarePhysician,
      },
    });
  },

  /**
   * Get all patients with optional pagination and filters
   */
  async findAll({ page = 1, limit = 10, search = '', gender, insuranceProvider }) {
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    const conditions = [];

    // Search filter
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

    // Gender filter
    if (gender) {
      conditions.push({ gender });
    }

    // Insurance provider filter
    if (insuranceProvider) {
      conditions.push({
        insuranceProvider: { contains: insuranceProvider, mode: 'insensitive' },
      });
    }

    // Combine conditions with AND
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a patient by ID
   */
  async findById(id) {
    return prisma.patient.findUnique({
      where: { id },
    });
  },

  /**
   * Get a patient by MRN
   */
  async findByMrn(mrn) {
    return prisma.patient.findUnique({
      where: { mrn },
    });
  },

  /**
   * Update a patient
   */
  async update(id, data) {
    const updateData = { ...data };

    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    return prisma.patient.update({
      where: { id },
      data: updateData,
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
