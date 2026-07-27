const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  deleter: { select: auditUserSelect },
};

function normalizeCode(value) {
  return String(value || '').trim();
}

function emptyToNull(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed || null;
}

const radiologyStudyService = {
  async create(data, userId) {
    const code = normalizeCode(data.code);
    const name = String(data.name || '').trim();

    if (!code) {
      const err = new Error('Radiology code is required');
      err.statusCode = 400;
      throw err;
    }
    if (!name) {
      const err = new Error('Radiology name is required');
      err.statusCode = 400;
      throw err;
    }

    return prisma.radiologyStudy.create({
      data: {
        name,
        code,
        modality: data.modality,
        bodyPart: emptyToNull(data.bodyPart),
        isActive: data.isActive !== false,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });
  },

  async findAll({
    page = 1,
    limit = 10,
    name = '',
    code = '',
    modality = '',
    bodyPart = '',
    isActive,
    createdFrom = '',
    createdTo = '',
  }) {
    const take = parseInt(limit, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * take;
    const conditions = [NOT_DELETED];

    if (name) {
      conditions.push({ name: { contains: name, mode: 'insensitive' } });
    }
    if (code) {
      conditions.push({ code: { contains: code, mode: 'insensitive' } });
    }
    if (modality) {
      conditions.push({ modality });
    }
    if (bodyPart) {
      conditions.push({ bodyPart: { contains: bodyPart, mode: 'insensitive' } });
    }
    if (isActive !== undefined && isActive !== '') {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }
    if (createdFrom) {
      conditions.push({ createdAt: { gte: new Date(createdFrom) } });
    }
    if (createdTo) {
      const end = new Date(createdTo);
      end.setHours(23, 59, 59, 999);
      conditions.push({ createdAt: { lte: end } });
    }

    const where = { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.radiologyStudy.findMany({
        where,
        skip,
        take,
        orderBy: [{ name: 'asc' }],
        include: auditInclude,
      }),
      prisma.radiologyStudy.count({ where }),
    ]);

    return {
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  },

  async findAllActive() {
    return prisma.radiologyStudy.findMany({
      where: { ...NOT_DELETED, isActive: true },
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        modality: true,
        bodyPart: true,
      },
    });
  },

  async findById(id) {
    return prisma.radiologyStudy.findFirst({
      where: { id, ...NOT_DELETED },
      include: auditInclude,
    });
  },

  async update(id, data, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Radiology study not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: userId };

    if (data.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) {
        const err = new Error('Radiology name cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.name = name;
    }
    if (data.code !== undefined) {
      const code = normalizeCode(data.code);
      if (!code) {
        const err = new Error('Radiology code cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      payload.code = code;
    }
    if (data.modality !== undefined) {
      payload.modality = data.modality;
    }
    if (data.bodyPart !== undefined) {
      payload.bodyPart = emptyToNull(data.bodyPart);
    }
    if (data.isActive !== undefined) {
      payload.isActive = !!data.isActive;
    }

    return prisma.radiologyStudy.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });
  },

  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Radiology study not found');
      err.statusCode = 404;
      throw err;
    }

    const orderCount = await prisma.order.count({
      where: {
        category: 'Radiology',
        procedureCode: existing.code,
      },
    });

    if (orderCount > 0) {
      await prisma.radiologyStudy.update({
        where: { id },
        data: {
          isActive: false,
          updatedBy: userId,
        },
      });
      return {
        success: true,
        deactivated: true,
        message:
          'This radiology study has been used in patient orders and was marked inactive instead of deleted.',
      };
    }

    await prisma.radiologyStudy.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false,
        updatedBy: userId,
      },
    });

    return {
      success: true,
      deactivated: false,
      message: 'Radiology study removed successfully',
    };
  },
};

module.exports = radiologyStudyService;
