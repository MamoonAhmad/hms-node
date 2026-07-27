const encounterProblemService = require('../services/encounterProblem.service');

const encounterProblemController = {
  async list(req, res, next) {
    try {
      const data = await encounterProblemService.listForAppointment(
        req.params.id,
        req.params.appointmentId,
      );
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async upsert(req, res, next) {
    try {
      const row = await encounterProblemService.upsert(
        req.params.id,
        req.params.appointmentId,
        req.params.problemId,
        req.body,
        req.user.id,
      );
      res.json({
        success: true,
        message: 'Encounter problem updated',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async setPrimary(req, res, next) {
    try {
      const row = await encounterProblemService.setPrimary(
        req.params.id,
        req.params.appointmentId,
        req.params.problemId,
        req.user.id,
      );
      res.json({
        success: true,
        message: 'Primary diagnosis set for this visit',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async syncCoding(req, res, next) {
    try {
      const data = await encounterProblemService.syncToChargeCapture(
        req.params.id,
        req.params.appointmentId,
        req.user.id,
      );
      res.json({
        success: true,
        message: data.synced ? 'Diagnoses synced to Coding' : data.reason || 'Nothing to sync',
        data,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404 || error?.statusCode === 409) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = encounterProblemController;
