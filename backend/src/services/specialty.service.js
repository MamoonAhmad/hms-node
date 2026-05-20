const prisma = require('../lib/prisma');

const specialtyService = {
  async create(data) {
    return prisma.specialty.create({
      data: {
        name: data.name,
        code: data.code,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
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
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (isActive !== undefined) {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    if (conditions.length) where.AND = conditions;

    const [rows, total] = await Promise.all([
      prisma.specialty.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { subSpecialties: true } },
        },
      }),
      prisma.specialty.count({ where }),
    ]);

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  },

  async findAllActive() {
    return prisma.specialty.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });
  },

  async findById(id) {
    return prisma.specialty.findUnique({
      where: { id },
      include: {
        _count: { select: { subSpecialties: true } },
      },
    });
  },

  async update(id, data) {
    return prisma.specialty.update({
      where: { id },
      data,
    });
  },

  async delete(id) {
    return prisma.specialty.delete({
      where: { id },
    });
  },
};

module.exports = specialtyService;

