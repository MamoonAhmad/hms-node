const appointmentService = require('../services/appointment.service');
const pick = require('../utils/pick');

const appointmentController = {
  /**
   * @swagger
   * /api/appointments:
   *   post:
   *     summary: Create a new appointment
   *     tags: [Appointments]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateAppointment'
   *     responses:
   *       201:
   *         description: Appointment created successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
  async create(req, res, next) {
    try {
      const appointment = await appointmentService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/appointments:
   *   get:
   *     summary: Get all appointments with pagination and filters
   *     tags: [Appointments]
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
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [Scheduled, Checked-In, In Progress, Completed, Cancelled, No-Show, Rescheduled]
   *       - in: query
   *         name: appointmentType
   *         schema:
   *           type: string
   *           enum: [New, Follow-up, Televisit]
   *       - in: query
   *         name: department
   *         schema:
   *           type: string
   *       - in: query
   *         name: date
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: patientId
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: List of appointments
   */
  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, [
        'page',
        'limit',
        'search',
        'status',
        'appointmentType',
        'department',
        'date',
        'patientId',
      ]);

      const result = await appointmentService.findAll(filters);
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
   * /api/appointments/today:
   *   get:
   *     summary: Get today's appointments
   *     tags: [Appointments]
   *     responses:
   *       200:
   *         description: List of today's appointments
   */
  async getTodayAppointments(req, res, next) {
    try {
      const appointments = await appointmentService.getTodayAppointments();
      res.json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/appointments/{id}:
   *   get:
   *     summary: Get an appointment by ID
   *     tags: [Appointments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Appointment details
   *       404:
   *         description: Appointment not found
   */
  async findById(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }
      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/appointments/{id}:
   *   put:
   *     summary: Update an appointment
   *     tags: [Appointments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateAppointment'
   *     responses:
   *       200:
   *         description: Appointment updated successfully
   *       404:
   *         description: Appointment not found
   */
  async update(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      const updatedAppointment = await appointmentService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: updatedAppointment,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/appointments/{id}:
   *   delete:
   *     summary: Delete an appointment
   *     tags: [Appointments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Appointment deleted successfully
   *       404:
   *         description: Appointment not found
   */
  async delete(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      await appointmentService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Appointment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/appointments/{id}/status:
   *   patch:
   *     summary: Update appointment status
   *     tags: [Appointments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [Scheduled, Checked-In, In Progress, Completed, Cancelled, No-Show, Rescheduled]
   *     responses:
   *       200:
   *         description: Status updated successfully
   */
  async updateStatus(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      const updatedAppointment = await appointmentService.update(req.params.id, {
        status: req.body.status,
      });
      res.json({
        success: true,
        message: 'Appointment status updated successfully',
        data: updatedAppointment,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = appointmentController;

