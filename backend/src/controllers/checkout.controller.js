const checkoutService = require('../services/checkout.service');

const checkoutController = {
  async getBundle(req, res, next) {
    try {
      const encounterId = req.query.encounterId || req.body?.encounterId;
      const data = await checkoutService.getCheckoutBundle(
        req.params.patientId,
        encounterId,
        req.user,
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await checkoutService.updateCheckout(
        req.params.patientId,
        req.body.encounterId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Checkout updated', data });
    } catch (error) {
      next(error);
    }
  },

  async upsertInstruction(req, res, next) {
    try {
      const instruction = await checkoutService.upsertInstruction(
        req.params.patientId,
        req.body.encounterId,
        req.params.instructionId || null,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Instruction saved', data: instruction });
    } catch (error) {
      next(error);
    }
  },

  async deleteInstruction(req, res, next) {
    try {
      await checkoutService.deleteInstruction(
        req.params.patientId,
        req.query.encounterId,
        req.params.instructionId,
      );
      res.json({ success: true, message: 'Instruction deleted' });
    } catch (error) {
      next(error);
    }
  },

  async addNote(req, res, next) {
    try {
      const note = await checkoutService.addNote(
        req.params.patientId,
        req.body.encounterId,
        req.body,
        req.user,
      );
      res.status(201).json({ success: true, message: 'Note added', data: note });
    } catch (error) {
      next(error);
    }
  },

  async addTask(req, res, next) {
    try {
      const task = await checkoutService.addTask(
        req.params.patientId,
        req.body.encounterId,
        req.body,
        req.user,
      );
      res.status(201).json({ success: true, message: 'Task created', data: task });
    } catch (error) {
      next(error);
    }
  },

  async recordPayment(req, res, next) {
    try {
      const payment = await checkoutService.recordPayment(
        req.params.patientId,
        req.body.encounterId,
        req.body,
        req.user,
      );
      res.status(201).json({ success: true, message: 'Payment recorded', data: payment });
    } catch (error) {
      next(error);
    }
  },

  async complete(req, res, next) {
    try {
      const data = await checkoutService.completeCheckout(
        req.params.patientId,
        req.body.encounterId,
        req.user,
      );
      res.json({ success: true, message: 'Checkout completed', data });
    } catch (error) {
      if (error?.statusCode === 400 && error.details) {
        return res.status(400).json({
          success: false,
          message: error.message,
          blockers: error.details,
        });
      }
      next(error);
    }
  },

  async reopen(req, res, next) {
    try {
      const data = await checkoutService.reopenCheckout(
        req.params.patientId,
        req.body.encounterId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Checkout reopened', data });
    } catch (error) {
      next(error);
    }
  },

  async previewAvs(req, res, next) {
    try {
      const encounterId = req.query.encounterId;
      const bundle = await checkoutService.getCheckoutBundle(
        req.params.patientId,
        encounterId,
        req.user,
      );
      const html = checkoutService.buildAvsHtml(bundle);
      res.json({ success: true, data: { html } });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = checkoutController;
