const referralService = require('../services/referral.service');
const pick = require('../utils/pick');

const referralController = {
  async getReferralTypes(req, res, next) {
    try {
      const data = await referralService.getReferralTypes(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getSummaryCounts(req, res, next) {
    try {
      const filters = pick(req.query, ['appointmentId']);
      const data = await referralService.getSummaryCounts(req.params.id, filters);
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
      const data = await referralService.getPatientPanel(req.params.id, req.query.appointmentId || null);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getEncounterDefaults(req, res, next) {
    try {
      const data = await referralService.getEncounterDefaults(req.params.id, req.query.appointmentId);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['status', 'priority', 'appointmentId']);
      const data = await referralService.findAll(req.params.id, filters);
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
      const row = await referralService.findById(req.params.id, req.params.referralId);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Referral not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const row = await referralService.create(req.params.id, req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Referral created successfully',
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
      const row = await referralService.update(req.params.id, req.params.referralId, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Referral updated successfully',
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
      const row = await referralService.updateStatus(
        req.params.id,
        req.params.referralId,
        req.body.status,
        req.user.id,
        req.body,
      );
      res.json({
        success: true,
        message: 'Referral status updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async send(req, res, next) {
    try {
      const row = await referralService.send(req.params.id, req.params.referralId, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Referral sent successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async addNote(req, res, next) {
    try {
      const row = await referralService.addNote(req.params.id, req.params.referralId, req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Note added successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getTimeline(req, res, next) {
    try {
      const data = await referralService.getTimeline(req.params.id, req.params.referralId);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const data = await referralService.getAuditLogs(req.params.id, req.params.referralId);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async cancel(req, res, next) {
    try {
      const row = await referralService.cancel(
        req.params.id,
        req.params.referralId,
        req.user.id,
        req.body?.notes,
      );
      res.json({
        success: true,
        message: 'Referral cancelled successfully',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async close(req, res, next) {
    try {
      const row = await referralService.close(req.params.id, req.params.referralId, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Referral closed successfully',
        data: row,
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
      await referralService.delete(req.params.id, req.params.referralId, req.user.id);
      res.json({ success: true, message: 'Referral deleted successfully' });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = referralController;
