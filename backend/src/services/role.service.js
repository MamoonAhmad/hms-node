const prisma = require('../lib/prisma');

const roleService = {
  /**
   * Create a new role
   */
  async create(data, userId) {
    const { permissionIds, ...roleData } = data;

    return prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description,
        isActive: roleData.isActive !== undefined ? roleData.isActive : true,
        createdBy: userId,
        updatedBy: userId,
        permissions: permissionIds && permissionIds.length > 0 ? {
          create: permissionIds.map(permissionId => ({
            permissionId,
          })),
        } : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  },

  /**
   * Get all roles with optional pagination and filters
   */
  async findAll({ page = 1, limit = 10, search = '', isActive }) {
    const skip = (page - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Active status filter
    if (isActive !== undefined && isActive !== '') {
      conditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    // Combine conditions with AND
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: parseInt(limit) || 10,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updater: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              permissions: true,
            },
          },
        },
      }),
      prisma.role.count({ where }),
    ]);

    return {
      data: roles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  /**
   * Get a role by ID
   */
  async findById(id) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  },

  /**
   * Update a role
   */
  async update(id, data, userId) {
    const { permissionIds, ...roleData } = data;
    
    // If permissionIds is provided, update the permissions
    if (permissionIds !== undefined) {
      // Delete all existing permissions and create new ones
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    return prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        updatedBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  },

  /**
   * Delete a role
   */
  async delete(id) {
    return prisma.role.delete({
      where: { id },
    });
  },
};

module.exports = roleService;
