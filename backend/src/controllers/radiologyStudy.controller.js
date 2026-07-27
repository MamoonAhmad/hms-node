const radiologyStudyService = require('../services/radiologyStudy.service');
const pick = require('../utils/pick');

const radiologyStudyController = {
  async create(req, res, next) {
    try {
      const row = await radiologyStudyService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Radiology study created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A radiology study with this code already exists',
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
        'modality',
        'bodyPart',
        'isActive',
        'createdFrom',
        'createdTo',
      ]);
      const result = await radiologyStudyService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findAllActive(_req, res, next) {
    try {
      const rows = await radiologyStudyService.findAllActive();
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await radiologyStudyService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Radiology study not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await radiologyStudyService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Radiology study updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A radiology study with this code already exists',
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
      const result = await radiologyStudyService.delete(req.params.id, req.user.id);
      res.json({
        success: true,
        deactivated: result.deactivated,
        message: result.message,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = radiologyStudyController;
