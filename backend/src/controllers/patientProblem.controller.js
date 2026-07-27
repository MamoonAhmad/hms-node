const patientProblemService = require('../services/patientProblem.service');
const pick = require('../utils/pick');

const patientProblemController = {
  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['status']);
      const data = await patientProblemService.findAll(req.params.id, filters);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await patientProblemService.findById(req.params.id, req.params.problemId);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Problem not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const row = await patientProblemService.create(req.params.id, req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Problem added successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await patientProblemService.update(
        req.params.id,
        req.params.problemId,
        req.body,
        req.user.id,
      );
      res.json({
        success: true,
        message: 'Problem updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const row = await patientProblemService.updateStatus(
        req.params.id,
        req.params.problemId,
        req.body.status,
        req.user.id,
        { resolvedDate: req.body.resolvedDate },
      );
      res.json({
        success: true,
        message: 'Problem status updated successfully',
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
      const result = await patientProblemService.delete(
        req.params.id,
        req.params.problemId,
        req.user.id,
      );
      res.json(result);
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = patientProblemController;
