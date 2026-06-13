const procedureService = require('../services/procedure.service');
const pick = require('../utils/pick');

const procedureController = {
  async create(req, res, next) {
    try {
      const row = await procedureService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Procedure created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search', 'categoryId']);
      const result = await procedureService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await procedureService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Procedure not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await procedureService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Procedure updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await procedureService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Procedure deleted successfully' });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = procedureController;
