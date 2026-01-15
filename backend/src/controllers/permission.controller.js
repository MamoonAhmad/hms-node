const permissionService = require('../services/permission.service');
const pick = require('../utils/pick');

const permissionController = {
  /**
   * @swagger
   * /api/permissions:
   *   post:
   *     summary: Create a new permission
   *     tags: [Permissions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePermission'
   *     responses:
   *       201:
   *         description: Permission created successfully
   */
  async create(req, res, next) {
    try {
      const permission = await permissionService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Permission created successfully',
        data: permission,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/permissions:
   *   get:
   *     summary: Get all permissions with pagination
   *     tags: [Permissions]
   */
  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search', 'resource']);
      
      const result = await permissionService.findAll(filters);
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
   * /api/permissions/{id}:
   *   get:
   *     summary: Get a permission by ID
   *     tags: [Permissions]
   */
  async findById(req, res, next) {
    try {
      const permission = await permissionService.findById(req.params.id);
      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found',
        });
      }
      res.json({
        success: true,
        data: permission,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/permissions/{id}:
   *   put:
   *     summary: Update a permission
   *     tags: [Permissions]
   */
  async update(req, res, next) {
    try {
      const permission = await permissionService.findById(req.params.id);
      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found',
        });
      }

      const updatedPermission = await permissionService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Permission updated successfully',
        data: updatedPermission,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/permissions/{id}:
   *   delete:
   *     summary: Delete a permission
   *     tags: [Permissions]
   */
  async delete(req, res, next) {
    try {
      const permission = await permissionService.findById(req.params.id);
      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found',
        });
      }

      await permissionService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Permission deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = permissionController;

