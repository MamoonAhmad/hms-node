const bedService = require('../services/bed.service');
const pick = require('../utils/pick');

const bedController = {
  async create(req, res, next) {
    try {
      const row = await bedService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Bed created successfully',
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
      const filters = pick(req.query, ['page', 'limit', 'search', 'status', 'listTab']);
      const result = await bedService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getSummary(_req, res, next) {
    try {
      const summary = await bedService.getSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await bedService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Bed not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await bedService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Bed updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await bedService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Bed removed successfully',
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = bedController;
