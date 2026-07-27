const vaccineService = require('../services/vaccine.service');
const pick = require('../utils/pick');

const vaccineController = {
  async create(req, res, next) {
    try {
      const row = await vaccineService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Vaccine created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 409) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, [
        'page',
        'limit',
        'search',
        'vaccineName',
        'vaccineCode',
        'manufacturer',
        'route',
        'status',
        'createdDateFrom',
        'createdDateTo',
      ]);
      const result = await vaccineService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findActiveForOrders(req, res, next) {
    try {
      const filters = pick(req.query, ['search', 'limit']);
      const data = await vaccineService.findActiveForOrders(filters);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await vaccineService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Vaccine not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await vaccineService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Vaccine updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 400 || error?.statusCode === 409) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await vaccineService.delete(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = vaccineController;
