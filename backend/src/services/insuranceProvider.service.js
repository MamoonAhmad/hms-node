const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  deleter: { select: auditUserSelect },
};

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
        city: data.city,
        state: data.state,
        zip: data.zip,
        website: data.website,
        isActive: data.isActive !== undefined ? data.isActive : true,
        deletedAt: null,
      },
      include: auditInclude,
    });
  },

  /**
   * Get all insurance providers with optional pagination and filters
   */
  async findAll({ page = 1, limit = 10, search = '', payerId = '', name = '', isActive }) {
    const skip = (page - 1) * parseInt(limit);

    const conditions = [NOT_DELETED];

    if (payerId) {
      conditions.push({ code: { contains: payerId, mode: 'insensitive' } });
    }

    if (name) {
      conditions.push({ name: { contains: name, mode: 'insensitive' } });
    }

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (isActive !== undefined) {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    const where = { AND: conditions };

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
          ...auditInclude,
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
      where: { ...NOT_DELETED, isActive: true },
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
    return prisma.insuranceProvider.findFirst({
      where: { id, ...NOT_DELETED },
      include: {
        _count: {
          select: { patients: true },
        },
        ...auditInclude,
      },
    });
  },

  /**
   * Update an insurance provider
   */
  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Insurance provider not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { ...data };
    delete payload.deletedAt;
    delete payload.deletedBy;

    return prisma.insuranceProvider.update({
      where: { id },
      data: payload,
      include: auditInclude,
    });
  },

  /**
   * Soft delete — sets deletedAt, deletedBy, and deactivates.
   */
  async delete(id, userId) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Insurance provider not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.insuranceProvider.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false,
      },
      include: auditInclude,
    });
  },
};

module.exports = insuranceProviderService;
