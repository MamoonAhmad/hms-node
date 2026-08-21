const placeOfServiceService = require('../services/placeOfService.service');
const pick = require('../utils/pick');

const placeOfServiceController = {
  async create(req, res, next) {
    try {
      const row = await placeOfServiceService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Place of service created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 409) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A place of service with this code already exists',
        });
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
        'status',
        'isActive',
        'isBillable',
        'category',
        'cmsStandard',
        'lookup',
        'validOn',
      ]);
      const result = await placeOfServiceService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async lookup(req, res, next) {
    try {
      const filters = pick(req.query, ['search', 'limit', 'validOn']);
      const result = await placeOfServiceService.lookup(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await placeOfServiceService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Place of service not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await placeOfServiceService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Place of service updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error?.statusCode === 400 || error?.statusCode === 409) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await placeOfServiceService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Place of service deleted successfully' });
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
};

module.exports = placeOfServiceController;
