const appointmentTypeService = require('../services/appointmentType.service');
const pick = require('../utils/pick');

const appointmentTypeController = {
  /**
   * @swagger
   * /api/appointment-types:
   *   post:
   *     summary: Create a new appointment type
   *     tags: [Appointment Types]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateAppointmentType'
   *     responses:
   *       201:
   *         description: Appointment type created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/AppointmentType'
   *       400:
   *         description: Validation error
   *       409:
   *         description: An appointment type with this name already exists
   */
  async create(req, res, next) {
    try {
      const row = await appointmentTypeService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Appointment type created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'An appointment type with this name already exists',
        });
      }
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * @swagger
   * /api/appointment-types:
   *   get:
   *     summary: Get all appointment types with pagination
   *     tags: [Appointment Types]
   *     security:
   *       - bearerAuth: []
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
   *         description: Search by name or description
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *     responses:
   *       200:
   *         description: Paginated list of non-deleted appointment types
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
   *                     $ref: '#/components/schemas/AppointmentType'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   */
  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search', 'isActive']);
      const result = await appointmentTypeService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/appointment-types/active:
   *   get:
   *     summary: Get all active appointment types (for dropdowns)
   *     tags: [Appointment Types]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of active, non-deleted appointment types ordered by sortOrder
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
   *                     $ref: '#/components/schemas/AppointmentType'
   */
  async findAllActive(_req, res, next) {
    try {
      const rows = await appointmentTypeService.findAllActive();
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/appointment-types/{id}:
   *   get:
   *     summary: Get an appointment type by ID
   *     tags: [Appointment Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Appointment type ID
   *     responses:
   *       200:
   *         description: Appointment type details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/AppointmentType'
   *       404:
   *         description: Appointment type not found
   */
  async findById(req, res, next) {
    try {
      const row = await appointmentTypeService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Appointment type not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/appointment-types/{id}:
   *   put:
   *     summary: Update an appointment type
   *     tags: [Appointment Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Appointment type ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateAppointmentType'
   *     responses:
   *       200:
   *         description: Appointment type updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/AppointmentType'
   *       400:
   *         description: Validation error
   *       404:
   *         description: Appointment type not found
   *       409:
   *         description: An appointment type with this name already exists
   */
  async update(req, res, next) {
    try {
      const row = await appointmentTypeService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Appointment type updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'An appointment type with this name already exists',
        });
      }
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * @swagger
   * /api/appointment-types/{id}:
   *   delete:
   *     summary: Soft-delete an appointment type
   *     description: Sets deletedAt, isActive to false, and records deletedBy. The record is excluded from list and active endpoints.
   *     tags: [Appointment Types]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Appointment type ID
   *     responses:
   *       200:
   *         description: Appointment type removed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       404:
   *         description: Appointment type not found
   */
  async delete(req, res, next) {
    try {
      await appointmentTypeService.delete(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Appointment type removed successfully',
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = appointmentTypeController;
