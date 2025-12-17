const prisma = require('../lib/prisma');

const insuranceProviderService = {
  /**
   * Create a new insurance provider
   */
  async create(data) {
    return prisma.insuranceProvider.create({
      data: {
        name: data.name,
        code: data.code,
        phone: data.phone,
        email: data.email,
        address: data.address,
        website: data.website,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  },

  /**
   * Get all insurance providers with optional pagination and filters
   */
  async findAll({ page = 1, limit = 10, search = '', isActive }) {
    const skip = (page - 1) * parseInt(limit);

    const where = {};
    const conditions = [];

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (isActive !== undefined) {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [providers, total] = await Promise.all([
      prisma.insuranceProvider.findMany({
        where,
        skip,
        take: parseInt(limit) || 10,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { patients: true },
          },
        },
      }),
      prisma.insuranceProvider.count({ where }),
    ]);

    return {
      data: providers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  /**
   * Get all active insurance providers (for dropdowns)
   */
  async findAllActive() {
    return prisma.insuranceProvider.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  },

  /**
   * Get an insurance provider by ID
   */
  async findById(id) {
    return prisma.insuranceProvider.findUnique({
      where: { id },
      include: {
        _count: {
          select: { patients: true },
        },
      },
    });
  },

  /**
   * Update an insurance provider
   */
  async update(id, data) {
    return prisma.insuranceProvider.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete an insurance provider
   */
  async delete(id) {
    return prisma.insuranceProvider.delete({
      where: { id },
    });
  },
};

module.exports = insuranceProviderService;

