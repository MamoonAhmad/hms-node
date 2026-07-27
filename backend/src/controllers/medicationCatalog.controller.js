const medicationCatalogService = require('../services/medicationCatalog.service');
const pick = require('../utils/pick');

function handleServiceError(error, res, next) {
  if (error?.statusCode === 400 || error?.statusCode === 404 || error?.statusCode === 409) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      duplicate: error.duplicate,
    });
  }
  return next(error);
}

const medicationCatalogController = {
  async create(req, res, next) {
    try {
      const row = await medicationCatalogService.create(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Medication created successfully',
        data: row,
      });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, [
        'page',
        'limit',
        'search',
        'status',
        'dosageForm',
        'route',
        'medicationClass',
        'isControlledSubstance',
        'prescriptionRequired',
        'sortBy',
        'sortOrder',
      ]);
      if (filters.isControlledSubstance !== undefined) {
        if (filters.isControlledSubstance === 'true' || filters.isControlledSubstance === true) {
          filters.isControlledSubstance = true;
        } else if (filters.isControlledSubstance === 'false' || filters.isControlledSubstance === false) {
          filters.isControlledSubstance = false;
        } else {
          delete filters.isControlledSubstance;
        }
      }
      if (filters.prescriptionRequired !== undefined) {
        if (filters.prescriptionRequired === 'true' || filters.prescriptionRequired === true) {
          filters.prescriptionRequired = true;
        } else if (filters.prescriptionRequired === 'false' || filters.prescriptionRequired === false) {
          filters.prescriptionRequired = false;
        } else {
          delete filters.prescriptionRequired;
        }
      }
      const result = await medicationCatalogService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async search(req, res, next) {
    try {
      const data = await medicationCatalogService.search(req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const includeHistory = req.query.includeHistory === 'true' || req.query.includeHistory === true;
      const row = await medicationCatalogService.findById(req.params.id, { includeHistory });
      if (!row) {
        return res.status(404).json({ success: false, message: 'Medication not found' });
      }
      res.json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req, res, next) {
    try {
      const data = await medicationCatalogService.getHistory(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  },

  async update(req, res, next) {
    try {
      const row = await medicationCatalogService.update(req.params.id, req.body, req.user);
      res.json({
        success: true,
        message: 'Medication updated successfully',
        data: row,
      });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  },

  async activate(req, res, next) {
    try {
      const row = await medicationCatalogService.activate(req.params.id, req.user);
      res.json({
        success: true,
        message: 'Medication activated successfully',
        data: row,
      });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  },

  async deactivate(req, res, next) {
    try {
      const row = await medicationCatalogService.deactivate(req.params.id, req.user);
      res.json({
        success: true,
        message: 'Medication deactivated successfully',
        data: row,
      });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await medicationCatalogService.delete(req.params.id, req.user);
      res.json(result);
    } catch (error) {
      handleServiceError(error, res, next);
    }
  },
};

module.exports = medicationCatalogController;
