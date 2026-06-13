const consentFormService = require('../services/consentForm.service');
const pick = require('../utils/pick');

const consentFormController = {
  async create(req, res, next) {
    try {
      const row = await consentFormService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Consent form created successfully',
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
      const filters = pick(req.query, ['page', 'limit', 'search', 'tab']);
      const result = await consentFormService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await consentFormService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({
          success: false,
          message: 'Consent form not found',
        });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await consentFormService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Consent form updated successfully',
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
      await consentFormService.delete(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Consent form deleted successfully',
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = consentFormController;
