const orderService = require('../services/order.service');
const pick = require('../utils/pick');

const orderController = {
  async getSites(req, res, next) {
    try {
      res.json({ success: true, data: orderService.getSites() });
    } catch (error) {
      next(error);
    }
  },

  async searchProcedures(req, res, next) {
    try {
      const { q, category } = req.query;
      const data = await orderService.searchProcedures({ q, category });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { patientId, appointmentId, locationId, orders, orderedBy } = req.body;
      const orderedByName = orderedBy || req.user?.name || req.user?.email || null;
      const created = await orderService.createOrders({
        patientId,
        appointmentId: appointmentId || null,
        locationId: locationId || null,
        orders,
        orderedBy: orderedByName,
        orderedByUserId: req.user?.id,
        orderedByUserName: orderedByName,
        userId: req.user?.id,
      });
      res.status(201).json({
        success: true,
        message: 'Orders saved successfully',
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

  async update(req, res, next) {
    try {
      const userName = req.user?.name || req.user?.email || null;
      const data = await orderService.updateOrder(req.params.id, req.body, req.user.id, userName);
      res.json({ success: true, message: 'Order updated', data });
    } catch (error) {
      next(error);
    }
  },

  async batchUpdate(req, res, next) {
    try {
      const userName = req.user?.name || req.user?.email || null;
      const data = await orderService.updateOrders(req.body.orders, req.user.id, userName);
      res.json({ success: true, message: 'Orders updated', data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const userName = req.user?.name || req.user?.email || null;
      await orderService.deleteOrder(req.params.id, req.user.id, userName);
      res.json({ success: true, message: 'Order deleted' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = orderController;
