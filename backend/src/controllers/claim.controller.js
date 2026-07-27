const claimService = require('../services/claim.service');

const claimController = {
  async getChargeCapture(req, res, next) {
    try {
      const encounterId = req.query.encounterId;
      const data = await claimService.getOrCreateChargeCapture(
        req.params.patientId,
        encounterId,
        req.user,
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async upsertChargeCapture(req, res, next) {
    try {
      const data = await claimService.upsertChargeCapture(
        req.params.patientId,
        req.body.encounterId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Charge capture saved', data });
    } catch (error) {
      next(error);
    }
  },

  async lockChargeCapture(req, res, next) {
    try {
      const data = await claimService.lockChargeCapture(
        req.params.patientId,
        req.body.encounterId,
        req.user,
      );
      res.json({ success: true, message: 'Charges locked', data });
    } catch (error) {
      next(error);
    }
  },

  async unlockChargeCapture(req, res, next) {
    try {
      const data = await claimService.unlockChargeCapture(
        req.params.patientId,
        req.body.encounterId,
        req.user,
      );
      res.json({ success: true, message: 'Charges unlocked', data });
    } catch (error) {
      next(error);
    }
  },

  async generateClaim(req, res, next) {
    try {
      const data = await claimService.generateClaimFromEncounter(
        req.params.patientId,
        req.body.encounterId,
        req.user,
      );
      res.status(201).json({ success: true, message: 'Claim created', data });
    } catch (error) {
      next(error);
    }
  },

  async listClaims(req, res, next) {
    try {
      const result = await claimService.listClaims(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getClaim(req, res, next) {
    try {
      const data = await claimService.getClaimById(req.params.claimId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateClaimStatus(req, res, next) {
    try {
      const data = await claimService.updateClaimStatus(
        req.params.claimId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Claim status updated', data });
    } catch (error) {
      next(error);
    }
  },

  async listWorklist(req, res, next) {
    try {
      const result = await claimService.listClaimsWorklist(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async updateWorklistItem(req, res, next) {
    try {
      const data = await claimService.updateWorklistItem(
        req.params.checkoutId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Worklist item updated', data });
    } catch (error) {
      next(error);
    }
  },

  async removeFromWorklist(req, res, next) {
    try {
      const data = await claimService.removeFromWorklist(req.params.checkoutId, req.user);
      res.json({ success: true, message: 'Encounter removed from worklist', data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = claimController;
