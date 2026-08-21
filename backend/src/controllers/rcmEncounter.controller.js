const rcmEncounterService = require('../services/rcmEncounter.service');

const rcmEncounterController = {
  async getById(req, res, next) {
    try {
      const { id } = req.validatedParams || req.params;
      const data = await rcmEncounterService.getById(id);
      res.json({ success: true, data });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  async updateBillingStatus(req, res, next) {
    try {
      const { id } = req.validatedParams || req.params;
      const body = req.validatedBody || req.body;
      const data = await rcmEncounterService.updateBillingStatus(id, body.billingStatus, req.user);
      res.json({ success: true, data });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  async updateDiagnoses(req, res, next) {
    try {
      const { id } = req.validatedParams || req.params;
      const body = req.validatedBody || req.body;
      const data = await rcmEncounterService.updateDiagnoses(id, body.diagnoses, req.user);
      res.json({ success: true, data });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message, errors: error.details });
      }
      next(error);
    }
  },

  async updateCharges(req, res, next) {
    try {
      const { id } = req.validatedParams || req.params;
      const body = req.validatedBody || req.body;
      const data = await rcmEncounterService.updateCharges(id, body.charges, req.user);
      res.json({ success: true, data });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message, errors: error.details });
      }
      next(error);
    }
  },

  async addPayment(req, res, next) {
    try {
      const { id } = req.validatedParams || req.params;
      const body = req.validatedBody || req.body;
      const data = await rcmEncounterService.addPayment(id, body, req.user);
      res.json({ success: true, data });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  async addFollowUpNote(req, res, next) {
    try {
      const { id } = req.validatedParams || req.params;
      const body = req.validatedBody || req.body;
      const data = await rcmEncounterService.addFollowUpNote(id, body, req.user);
      res.json({ success: true, data });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  async verifyEligibility(req, res, next) {
    try {
      const { id } = req.validatedParams || req.params;
      const data = await rcmEncounterService.verifyEligibility(id, req.user);
      res.json({ success: true, data });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  },
};

module.exports = rcmEncounterController;
