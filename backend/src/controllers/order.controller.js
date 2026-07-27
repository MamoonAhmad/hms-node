const orderService = require('../services/order.service');
const pick = require('../utils/pick');

const orderController = {
  async create(req, res, next) {
    try {
      const { patientId, appointmentId, locationId, orders, orderedBy } = req.body;
      const orderedByValue = orderedBy || req.user?.name || req.user?.email || null;
      const created = await orderService.createOrders({
        patientId,
        appointmentId: appointmentId || null,
        locationId: locationId || null,
        orders,
        orderedBy: orderedByValue,
        user: req.user || null,
      });
      res.status(201).json({
        success: true,
        message: 'Orders created successfully',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, [
        'patientId',
        'appointmentId',
        'category',
        'destination',
        'page',
        'limit',
      ]);
      const result = await orderService.findAll(filters);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await orderService.findById(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const updated = await orderService.updateStatus(req.params.id, req.body.status);
      res.json({
        success: true,
        message: 'Order status updated',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateSpecimen(req, res, next) {
    try {
      const updated = await orderService.updateSpecimenCollection(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Specimen collection updated',
        data: updated,
      });
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = orderController;
