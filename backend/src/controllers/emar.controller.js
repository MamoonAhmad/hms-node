const emarService = require('../services/emar.service');

const emarController = {
  async findAll(req, res, next) {
    try {
      if (req.query.tab === 'history') {
        const data = await emarService.getHistory(req.params.id, req.query);
        return res.json({ success: true, data });
      }
      const data = await emarService.findAll(req.params.id, req.query);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getTabCounts(req, res, next) {
    try {
      const data = await emarService.getTabCounts(req.params.id, req.query.appointmentId);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getPatientPanel(req, res, next) {
    try {
      const data = await emarService.getPatientPanel(req.params.id, req.query.appointmentId);
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
      const row = await emarService.findById(req.params.id, req.params.marEntryId);
      if (!row) {
        return res.status(404).json({ success: false, message: 'MAR entry not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async getAdministrationHistory(req, res, next) {
    try {
      const data = await emarService.getAdministrationHistory(req.params.id, req.params.marEntryId);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async recordAdministration(req, res, next) {
    try {
      const data = await emarService.recordAdministration(
        req.params.id,
        req.params.marEntryId,
        req.body,
        req.user,
      );
      res.status(201).json({
        success: true,
        message: 'Administration recorded',
        data,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async discontinue(req, res, next) {
    try {
      const data = await emarService.discontinue(
        req.params.id,
        req.params.marEntryId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Medication discontinued', data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getTimeline(req, res, next) {
    try {
      const data = await emarService.getTimeline(req.params.id, req.query.appointmentId);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = emarController;
