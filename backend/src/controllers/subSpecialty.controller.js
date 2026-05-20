const subSpecialtyService = require('../services/subSpecialty.service');
const pick = require('../utils/pick');

const subSpecialtyController = {
  async create(req, res, next) {
    try {
      const row = await subSpecialtyService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Sub speciality created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Sub speciality with this name/code already exists for the selected speciality',
        });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search', 'specialtyId', 'isActive']);
      const result = await subSpecialtyService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await subSpecialtyService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Sub speciality not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await subSpecialtyService.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Sub speciality not found' });
      }
      const row = await subSpecialtyService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Sub speciality updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Sub speciality with this name/code already exists for the selected speciality',
        });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await subSpecialtyService.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Sub speciality not found' });
      }
      await subSpecialtyService.delete(req.params.id);
      res.json({ success: true, message: 'Sub speciality deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = subSpecialtyController;

