const roomService = require('../services/room.service');
const pick = require('../utils/pick');

const roomController = {
  async create(req, res, next) {
    try {
      const row = await roomService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A room with this room number already exists',
        });
      }
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search', 'status']);
      const result = await roomService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async findAllActive(req, res, next) {
    try {
      const filters = pick(req.query, ['departmentId']);
      const rows = await roomService.findAllActive(filters);
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  },

  async getSummary(_req, res, next) {
    try {
      const summary = await roomService.getSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await roomService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await roomService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Room updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A room with this room number already exists',
        });
      }
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await roomService.delete(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Room removed successfully',
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = roomController;
