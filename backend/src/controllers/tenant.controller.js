const tenantService = require('../services/tenant.service');
const pick = require('../utils/pick');

const tenantController = {
  /**
   * @swagger
   * /api/tenants:
   *   post:
   *     summary: Create a new tenant
   *     tags: [Tenants]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateTenant'
   *     responses:
   *       201:
   *         description: Tenant created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Tenant'
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
  async create(req, res, next) {
    try {
      const tenant = await tenantService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Tenant created successfully',
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/tenants:
   *   get:
   *     summary: Get all tenants with pagination
   *     tags: [Tenants]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *     responses:
   *       200:
   *         description: List of tenants
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Tenant'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   */
  async findAll(req, res, next) {
    try {
      // Pick only allowed query parameters
      const filters = pick(req.query, ['page', 'limit', 'search', 'isActive']);
      
      const result = await tenantService.findAll(filters);
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
   * /api/tenants/{id}:
   *   get:
   *     summary: Get a tenant by ID
   *     tags: [Tenants]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Tenant ID
   *     responses:
   *       200:
   *         description: Tenant details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Tenant'
   *       404:
   *         description: Tenant not found
   */
  async findById(req, res, next) {
    try {
      const tenant = await tenantService.findById(req.params.id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }
      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/tenants/{id}:
   *   put:
   *     summary: Update a tenant
   *     tags: [Tenants]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Tenant ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateTenant'
   *     responses:
   *       200:
   *         description: Tenant updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Tenant'
   *       404:
   *         description: Tenant not found
   */
  async update(req, res, next) {
    try {
      const tenant = await tenantService.findById(req.params.id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      const updatedTenant = await tenantService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Tenant updated successfully',
        data: updatedTenant,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/tenants/{id}:
   *   delete:
   *     summary: Delete a tenant
   *     tags: [Tenants]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Tenant ID
   *     responses:
   *       200:
   *         description: Tenant deleted successfully
   *       404:
   *         description: Tenant not found
   */
  async delete(req, res, next) {
    try {
      const tenant = await tenantService.findById(req.params.id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      await tenantService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Tenant deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = tenantController;
