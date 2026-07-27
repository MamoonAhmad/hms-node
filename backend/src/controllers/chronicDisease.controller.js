const chronicDiseaseService = require('../services/chronicDisease.service');

const chronicDiseaseController = {
  async listTemplates(req, res, next) {
    try {
      const data = await chronicDiseaseService.listTemplates();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async listRecords(req, res, next) {
    try {
      const data = await chronicDiseaseService.listRecords(req.params.patientId, {
        encounterId: req.query.encounterId || null,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async createRecord(req, res, next) {
    try {
      const data = await chronicDiseaseService.createRecord(
        req.params.patientId,
        req.body,
        req.user,
      );
      res.status(201).json({ success: true, message: 'Chronic condition saved', data });
    } catch (error) {
      next(error);
    }
  },

  async updateRecord(req, res, next) {
    try {
      const data = await chronicDiseaseService.updateRecord(
        req.params.patientId,
        req.params.recordId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Chronic condition updated', data });
    } catch (error) {
      next(error);
    }
  },

  async deleteRecord(req, res, next) {
    try {
      const data = await chronicDiseaseService.deleteRecord(
        req.params.patientId,
        req.params.recordId,
      );
      res.json({ success: true, message: 'Chronic condition deleted', data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = chronicDiseaseController;
