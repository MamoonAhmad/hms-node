const prisma = require('../lib/prisma');

const providerService = {
  async create(data) {
    return prisma.provider.create({
      data,
    });
  },

  async findAll({ page = 1, limit = 10, search = '', isActive }) {
    const take = parseInt(limit) || 10;
    const skip = (parseInt(page) - 1) * take;

    const where = {};
    const conditions = [];

    if (search) {
      conditions.push({
        OR: [
          { npi: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { specialty: { contains: search, mode: 'insensitive' } },
          { mobileNumber: { contains: search, mode: 'insensitive' } },
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
      prisma.provider.findMany({
        where,
        skip,
        take,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      prisma.provider.count({ where }),
    ]);

    return {
      data: providers,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  },

  async findById(id) {
    return prisma.provider.findUnique({
      where: { id },
    });
  },

  async update(id, data) {
    return prisma.provider.update({
      where: { id },
      data,
    });
  },

  async delete(id) {
    return prisma.provider.delete({
      where: { id },
    });
  },
};

module.exports = providerService;

