const hcpcsCodeService = require('../services/hcpcsCode.service');
const pick = require('../utils/pick');

const hcpcsCodeController = {
  async create(req, res, next) {
    try {
      const row = await hcpcsCodeService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'HCPCS code created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'An HCPCS code with this code already exists',
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
        'coverageStatus',
        'lookup',
        'validOn',
      ]);
      const result = await hcpcsCodeService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await hcpcsCodeService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'HCPCS code not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await hcpcsCodeService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'HCPCS code updated successfully',
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
          message: 'An HCPCS code with this code already exists',
        });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await hcpcsCodeService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'HCPCS code deleted successfully' });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = hcpcsCodeController;
