const patientProblemService = require('../services/patientProblem.service');

const patientProblemController = {
  patientIdParam(req) {
    return req.params.id || req.params.patientId;
  },

  async findAll(req, res, next) {
    try {
      const query = req.query;
      const data = await patientProblemService.findAll(patientProblemController.patientIdParam(req), query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await patientProblemService.findById(
        patientProblemController.patientIdParam(req),
        req.params.problemId,
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const data = await patientProblemService.create(
        patientProblemController.patientIdParam(req),
        req.body,
        req.user,
      );
      res.status(201).json({ success: true, message: 'Problem added', data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await patientProblemService.update(
        patientProblemController.patientIdParam(req),
        req.params.problemId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Problem updated', data });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      await patientProblemService.remove(
        patientProblemController.patientIdParam(req),
        req.params.problemId,
        req.user,
      );
      res.json({ success: true, message: 'Problem removed' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = patientProblemController;
