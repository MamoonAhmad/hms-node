const medicationOrderService = require('../services/medicationOrder.service');

const medicationOrderController = {
  async findAll(req, res, next) {
    try {
      const data = await medicationOrderService.findAll(req.params.id, req.query);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getStatusCounts(req, res, next) {
    try {
      const data = await medicationOrderService.getStatusCounts(
        req.params.id,
        req.query.appointmentId,
      );
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
      const row = await medicationOrderService.findById(req.params.id, req.params.orderId);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Medication order not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const row = await medicationOrderService.create(req.params.id, req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Medication added to draft orders',
        data: row,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async bulkSave(req, res, next) {
    try {
      const data = await medicationOrderService.bulkSave(req.params.id, req.body, req.user);
      res.json({
        success: true,
        message: 'Draft orders saved',
        data,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async bulkSign(req, res, next) {
    try {
      const data = await medicationOrderService.bulkSign(req.params.id, req.body.orderIds, req.user);
      res.json({
        success: true,
        message: 'Medication orders signed',
        data,
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
      const row = await medicationOrderService.updateStatus(
        req.params.id,
        req.params.orderId,
        req.body.status,
        req.user,
        { eRxStatus: req.body.eRxStatus },
      );
      res.json({ success: true, data: row });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async acknowledgeSafety(req, res, next) {
    try {
      const row = await medicationOrderService.acknowledgeSafety(
        req.params.id,
        req.params.orderId,
        req.user,
      );
      res.json({ success: true, data: row });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const data = await medicationOrderService.getAuditLogs(req.params.id, req.params.orderId);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = medicationOrderController;
