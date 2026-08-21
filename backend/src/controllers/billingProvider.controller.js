const billingProviderService = require('../services/billingProvider.service');
const pick = require('../utils/pick');

const billingProviderController = {
  async create(req, res, next) {
    try {
      const row = await billingProviderService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Billing provider created successfully',
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
      const filters = pick(req.query, ['page', 'limit', 'search', 'status', 'isActive', 'lookup']);
      const result = await billingProviderService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await billingProviderService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Billing provider not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await billingProviderService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Billing provider updated successfully',
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
      await billingProviderService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Billing provider deleted successfully' });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = billingProviderController;
