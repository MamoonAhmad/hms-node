const departmentService = require('../services/department.service');
const pick = require('../utils/pick');

const departmentController = {
  async create(req, res, next) {
    try {
      const row = await departmentService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A department with this code already exists',
        });
      }
      if (error?.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'Invalid facility location reference',
        });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search', 'status']);
      const result = await departmentService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findAllActive(_req, res, next) {
    try {
      const rows = await departmentService.findAllActive();
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const row = await departmentService.findById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await departmentService.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      const row = await departmentService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Department updated successfully',
        data: row,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A department with this code already exists',
        });
      }
      if (error?.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'Invalid facility location reference',
        });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await departmentService.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      await departmentService.delete(req.params.id);
      res.json({ success: true, message: 'Department deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = departmentController;
