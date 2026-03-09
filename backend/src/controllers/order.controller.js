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
};

module.exports = orderController;
