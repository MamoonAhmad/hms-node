const customOrderSetService = require('../services/customOrderSet.service');
const pick = require('../utils/pick');

const customOrderSetController = {
  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'status']);
      const result = await customOrderSetService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async search(req, res, next) {
    try {
      const { q, departmentId, locationId } = req.query;
      const data = await customOrderSetService.search({
        q,
        userId: req.user?.id,
        departmentId: departmentId || null,
        locationId: locationId || null,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await customOrderSetService.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Custom order set not found' });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const data = await customOrderSetService.create(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Custom order set created', data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await customOrderSetService.update(req.params.id, req.body, req.user.id);
      res.json({ success: true, message: 'Custom order set updated', data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await customOrderSetService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Custom order set deleted' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = customOrderSetController;
