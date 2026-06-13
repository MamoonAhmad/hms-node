const chiefComplaintService = require('../services/chiefComplaint.service');
const pick = require('../utils/pick');

const chiefComplaintController = {
  async create(req, res, next) {
    try {
      const row = await chiefComplaintService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Chief complaint created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A chief complaint with this name or code already exists',
        });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search']);
      const result = await chiefComplaintService.findAll(filters, req.user.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findAllActive(req, res, next) {
    try {
      const rows = await chiefComplaintService.findAllActive(req.user.id);
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await chiefComplaintService.findById(req.params.id, req.user.id);
      if (!row) {
        return res.status(404).json({
          success: false,
          message: 'Chief complaint not found',
        });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await chiefComplaintService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Chief complaint updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A chief complaint with this name or code already exists',
        });
      }
      next(error);
    }
  },

  async toggleFavourite(req, res, next) {
    try {
      const result = await chiefComplaintService.toggleFavourite(req.params.id, req.user.id);
      res.json({
        success: true,
        message: result.isFavourite ? 'Added to favourites' : 'Removed from favourites',
        data: result,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await chiefComplaintService.delete(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Chief complaint deleted successfully',
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = chiefComplaintController;
