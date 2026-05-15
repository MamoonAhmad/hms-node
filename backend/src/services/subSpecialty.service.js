const prisma = require('../lib/prisma');

const subSpecialtyService = {
  async create(data) {
    return prisma.subSpecialty.create({
      data: {
        specialtyId: data.specialtyId,
        name: data.name,
        code: data.code,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        specialty: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async findAll({ page = 1, limit = 10, search = '', specialtyId, isActive }) {
    const take = parseInt(limit) || 10;
    const skip = (parseInt(page) - 1) * take;

    const where = {};
    const conditions = [];

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { specialty: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (specialtyId) {
      conditions.push({ specialtyId });
    }

    if (isActive !== undefined) {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    if (conditions.length) where.AND = conditions;

    const [rows, total] = await Promise.all([
      prisma.subSpecialty.findMany({
        where,
        skip,
        take,
        orderBy: [{ specialty: { name: 'asc' } }, { name: 'asc' }],
        include: {
          specialty: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.subSpecialty.count({ where }),
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

  async findById(id) {
    return prisma.subSpecialty.findUnique({
      where: { id },
      include: {
        specialty: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async update(id, data) {
    return prisma.subSpecialty.update({
      where: { id },
      data,
      include: {
        specialty: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async delete(id) {
    return prisma.subSpecialty.delete({
      where: { id },
    });
  },
};

module.exports = subSpecialtyService;

