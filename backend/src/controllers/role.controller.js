const roleService = require('../services/role.service');
const pick = require('../utils/pick');

const roleController = {
  /**
   * @swagger
   * /api/roles:
   *   post:
   *     summary: Create a new role
   *     tags: [Roles]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateRole'
   *     responses:
   *       201:
   *         description: Role created successfully
   */
  async create(req, res, next) {
    try {
      const role = await roleService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/roles:
   *   get:
   *     summary: Get all roles with pagination
   *     tags: [Roles]
   */
  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search', 'isActive']);
      
      const result = await roleService.findAll(filters);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/roles/{id}:
   *   get:
   *     summary: Get a role by ID
   *     tags: [Roles]
   */
  async findById(req, res, next) {
    try {
      const role = await roleService.findById(req.params.id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }
      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/roles/{id}:
   *   put:
   *     summary: Update a role
   *     tags: [Roles]
   */
  async update(req, res, next) {
    try {
      const role = await roleService.findById(req.params.id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }

      const updatedRole = await roleService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Role updated successfully',
        data: updatedRole,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/roles/{id}:
   *   delete:
   *     summary: Delete a role
   *     tags: [Roles]
   */
  async delete(req, res, next) {
    try {
      const role = await roleService.findById(req.params.id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }

      await roleService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = roleController;
