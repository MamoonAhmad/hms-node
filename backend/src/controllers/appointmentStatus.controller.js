const appointmentStatusService = require('../services/appointmentStatus.service');
const pick = require('../utils/pick');

const appointmentStatusController = {
  async create(req, res, next) {
    try {
      const row = await appointmentStatusService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Appointment status created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'An appointment status with this name already exists',
        });
      }
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search', 'isActive']);
      const result = await appointmentStatusService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findAllActive(_req, res, next) {
    try {
      const rows = await appointmentStatusService.findAllActive();
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await appointmentStatusService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Appointment status not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await appointmentStatusService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Appointment status updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'An appointment status with this name already exists',
        });
      }
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await appointmentStatusService.delete(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Appointment status removed successfully',
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = appointmentStatusController;
