const procedureCategoryService = require('../services/procedureCategory.service');
const pick = require('../utils/pick');

const procedureCategoryController = {
  async create(req, res, next) {
    try {
      const row = await procedureCategoryService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Procedure category created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A category with this name already exists',
        });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search']);
      const result = await procedureCategoryService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findAllActive(req, res, next) {
    try {
      const rows = await procedureCategoryService.findAllActive();
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await procedureCategoryService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Procedure category not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await procedureCategoryService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Procedure category updated successfully',
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
          message: 'A category with this name already exists',
        });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await procedureCategoryService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Procedure category deleted successfully' });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = procedureCategoryController;
