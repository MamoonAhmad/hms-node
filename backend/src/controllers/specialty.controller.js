const specialtyService = require('../services/specialty.service');
const pick = require('../utils/pick');

const specialtyController = {
  async create(req, res, next) {
    try {
      const row = await specialtyService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Speciality created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Speciality with this name/code already exists',
        });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search', 'isActive']);
      const result = await specialtyService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findAllActive(req, res, next) {
    try {
      const rows = await specialtyService.findAllActive();
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await specialtyService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Speciality not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await specialtyService.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Speciality not found' });
      }
      const row = await specialtyService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Speciality updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Speciality with this name/code already exists',
        });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await specialtyService.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Speciality not found' });
      }
      await specialtyService.delete(req.params.id);
      res.json({ success: true, message: 'Speciality deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = specialtyController;

