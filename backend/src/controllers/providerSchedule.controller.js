const providerScheduleService = require('../services/providerSchedule.service');
const pick = require('../utils/pick');

const providerScheduleController = {
  /**
   * @swagger
   * /api/provider-schedules:
   *   post:
   *     summary: Create a provider schedule
   *     tags: [Provider Schedules]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateProviderSchedule'
   *     responses:
   *       201:
   *         description: Schedule created successfully
   *       400:
   *         description: Validation error
   *       409:
   *         description: Overlapping schedule
   */
  async create(req, res, next) {
    try {
      const row = await providerScheduleService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
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
   * /api/provider-schedules:
   *   get:
   *     summary: List provider schedules with filters and pagination
   *     tags: [Provider Schedules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search across provider, specialty, days, times, types, locations, status
   *       - in: query
   *         name: providerIds
   *         schema:
   *           type: string
   *         description: Comma-separated provider UUIDs
   *       - in: query
   *         name: specialtyId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: days
   *         schema:
   *           type: string
   *         description: Comma-separated day codes (Mon,Tue,...)
   *       - in: query
   *         name: dateFrom
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: dateTo
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [Active, Inactive]
   *     responses:
   *       200:
   *         description: Paginated schedules
   */
  async findAll(req, res, next) {
    try {
      const filters = pick(req.validatedQuery || req.query, [
        'page',
        'limit',
        'search',
        'providerIds',
        'specialtyId',
        'days',
        'dateFrom',
        'dateTo',
        'status',
      ]);
      const result = await providerScheduleService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/provider-schedules/check-overlap:
   *   get:
   *     summary: Check whether a schedule would overlap existing ones
   *     tags: [Provider Schedules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: providerId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: days
   *         required: true
   *         schema:
   *           type: string
   *         description: Comma-separated day codes
   *       - in: query
   *         name: startTime
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: endTime
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: effectiveStartDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: effectiveEndDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: excludeScheduleId
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Overlap check result
   */
  async checkOverlap(req, res, next) {
    try {
      const result = await providerScheduleService.checkOverlap(req.validatedQuery || req.query);
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
   * /api/provider-schedules/{id}:
   *   get:
   *     summary: Get a provider schedule by ID
   *     tags: [Provider Schedules]
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
   *         description: Schedule details
   *       404:
   *         description: Schedule not found
   */
  async findById(req, res, next) {
    try {
      const row = await providerScheduleService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Schedule not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/provider-schedules/{id}:
   *   put:
   *     summary: Update a provider schedule
   *     tags: [Provider Schedules]
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
   *             $ref: '#/components/schemas/UpdateProviderSchedule'
   *     responses:
   *       200:
   *         description: Schedule updated successfully
   *       404:
   *         description: Schedule not found
   *       409:
   *         description: Overlapping schedule
   */
  async update(req, res, next) {
    try {
      const row = await providerScheduleService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Schedule updated successfully',
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
   * /api/provider-schedules/{id}/toggle-status:
   *   patch:
   *     summary: Toggle schedule Active/Inactive status
   *     tags: [Provider Schedules]
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
   *         description: Schedule not found
   */
  async toggleStatus(req, res, next) {
    try {
      const row = await providerScheduleService.toggleStatus(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Schedule status updated',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * @swagger
   * /api/provider-schedules/{id}:
   *   delete:
   *     summary: Soft-delete a provider schedule
   *     tags: [Provider Schedules]
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
   *         description: Schedule deleted successfully
   *       404:
   *         description: Schedule not found
   */
  async delete(req, res, next) {
    try {
      await providerScheduleService.delete(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Schedule deleted successfully',
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = providerScheduleController;
