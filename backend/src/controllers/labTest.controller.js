const labTestService = require('../services/labTest.service');
const pick = require('../utils/pick');

const labTestController = {
  async create(req, res, next) {
    try {
      const row = await labTestService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Laboratory test created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A laboratory test with this lab code already exists',
        });
      }
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, [
        'page',
        'limit',
        'name',
        'code',
        'category',
        'specimenType',
        'isActive',
        'createdFrom',
        'createdTo',
      ]);
      const result = await labTestService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findAllActive(_req, res, next) {
    try {
      const rows = await labTestService.findAllActive();
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await labTestService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Laboratory test not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await labTestService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Laboratory test updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A laboratory test with this lab code already exists',
        });
      }
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await labTestService.delete(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = labTestController;
