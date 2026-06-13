const diagnosisCodeService = require('../services/diagnosisCode.service');
const pick = require('../utils/pick');

const diagnosisCodeController = {
  async create(req, res, next) {
    try {
      const row = await diagnosisCodeService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Diagnosis code created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A diagnosis code with this ICD code already exists',
        });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search']);
      const result = await diagnosisCodeService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await diagnosisCodeService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Diagnosis code not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await diagnosisCodeService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Diagnosis code updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A diagnosis code with this ICD code already exists',
        });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await diagnosisCodeService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Diagnosis code deleted successfully' });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = diagnosisCodeController;
