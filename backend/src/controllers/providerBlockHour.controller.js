const providerBlockHourService = require('../services/providerBlockHour.service');
const pick = require('../utils/pick');

const providerBlockHourController = {
  /**
   * @swagger
   * /api/provider-block-hours:
   *   post:
   *     summary: Create a provider block hours record
   *     tags: [Provider Block Hours]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateProviderBlockHour'
   *     responses:
   *       201:
   *         description: Block created successfully
   *       400:
   *         description: Validation error or block outside schedule
   *       409:
   *         description: Overlapping active block
   */
  async create(req, res, next) {
    try {
      const row = await providerBlockHourService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Block hours created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      if (error?.statusCode === 409) {
        return res.status(409).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * @swagger
   * /api/provider-block-hours:
   *   get:
   *     summary: List provider block hours with filters and pagination
   *     tags: [Provider Block Hours]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *       - in: query
   *         name: providerId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: days
   *         schema:
   *           type: string
   *         description: Comma-separated day codes or repeat param
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [Active, Inactive]
   *     responses:
   *       200:
   *         description: Paginated block hours list
   */
  async findAll(req, res, next) {
    try {
      const filters = pick(req.validatedQuery || req.query, [
        'page',
        'limit',
        'search',
        'providerId',
        'departmentId',
        'days',
        'status',
      ]);
      const result = await providerBlockHourService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/provider-block-hours/check-overlap:
   *   get:
   *     summary: Check whether a block would overlap existing active blocks
   *     tags: [Provider Block Hours]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Overlap check result
   */
  async checkOverlap(req, res, next) {
    try {
      const result = await providerBlockHourService.checkOverlap(req.validatedQuery || req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * @swagger
   * /api/provider-block-hours/validate-within-schedule:
   *   get:
   *     summary: Check whether a block falls within provider active schedules
   *     tags: [Provider Block Hours]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Within-schedule check result
   */
  async validateWithinSchedule(req, res, next) {
    try {
      const result = await providerBlockHourService.validateWithinSchedule(
        req.validatedQuery || req.query,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * @swagger
   * /api/provider-block-hours/{id}:
   *   get:
   *     summary: Get a block hours record by ID (read-only view)
   *     tags: [Provider Block Hours]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Block details
   *       404:
   *         description: Block not found
   */
  async findById(req, res, next) {
    try {
      const row = await providerBlockHourService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Block not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/provider-block-hours/{id}:
   *   put:
   *     summary: Update a provider block hours record
   *     tags: [Provider Block Hours]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateProviderBlockHour'
   *     responses:
   *       200:
   *         description: Block updated successfully
   *       404:
   *         description: Block not found
   *       409:
   *         description: Overlapping active block
   */
  async update(req, res, next) {
    try {
      const row = await providerBlockHourService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Block hours updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      if (error?.statusCode === 409) {
        return res.status(409).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * @swagger
   * /api/provider-block-hours/{id}/toggle-status:
   *   patch:
   *     summary: Toggle block Active/Inactive status
   *     tags: [Provider Block Hours]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Status toggled
   *       404:
   *         description: Block not found
   *       409:
   *         description: Cannot activate due to overlap
   */
  async toggleStatus(req, res, next) {
    try {
      const row = await providerBlockHourService.toggleStatus(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Block status updated',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error?.statusCode === 409) {
        return res.status(409).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * @swagger
   * /api/provider-block-hours/{id}:
   *   delete:
   *     summary: Soft-delete a provider block hours record
   *     tags: [Provider Block Hours]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Block deleted successfully
   *       404:
   *         description: Block not found
   */
  async delete(req, res, next) {
    try {
      await providerBlockHourService.delete(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Block hours deleted successfully',
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = providerBlockHourController;
