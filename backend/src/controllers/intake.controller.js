const intakeService = require('../services/intake.service');

const intakeController = {
  async getBundle(req, res, next) {
    try {
      const data = await intakeService.getIntakeBundle(req.params.patientId, {
        encounterId: req.query.encounterId || null,
        sectionType: req.query.sectionType || null,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async createRecord(req, res, next) {
    try {
      const record = await intakeService.createRecord(
        req.params.patientId,
        req.body,
        req.user,
      );
      res.status(201).json({ success: true, message: 'Intake record saved', data: record });
    } catch (error) {
      next(error);
    }
  },

  async updateRecord(req, res, next) {
    try {
      const record = await intakeService.updateRecord(
        req.params.patientId,
        req.params.recordId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Intake record updated', data: record });
    } catch (error) {
      next(error);
    }
  },

  async addAddendum(req, res, next) {
    try {
      const result = await intakeService.addAddendum(
        req.params.patientId,
        req.params.recordId,
        req.body,
        req.user,
      );
      res.status(201).json({ success: true, message: 'Addendum saved', data: result });
    } catch (error) {
      next(error);
    }
  },

  async deleteRecord(req, res, next) {
    try {
      await intakeService.deleteRecord(req.params.patientId, req.params.recordId);
      res.json({ success: true, message: 'Intake record deleted' });
    } catch (error) {
      next(error);
    }
  },

  async certify(req, res, next) {
    try {
      const status = await intakeService.certifyIntake(
        req.params.patientId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Intake certified', data: status });
    } catch (error) {
      next(error);
    }
  },

  async complete(req, res, next) {
    try {
      const status = await intakeService.completeIntake(
        req.params.patientId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Intake completed', data: status });
    } catch (error) {
      next(error);
    }
  },

  async listAllergies(req, res, next) {
    try {
      const data = await intakeService.listAllergies(req.params.patientId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async createAllergy(req, res, next) {
    try {
      const allergy = await intakeService.createAllergy(req.params.patientId, req.body);
      res.status(201).json({ success: true, message: 'Allergy saved', data: allergy });
    } catch (error) {
      next(error);
    }
  },

  async updateAllergy(req, res, next) {
    try {
      const allergy = await intakeService.updateAllergy(
        req.params.patientId,
        req.params.allergyId,
        req.body,
      );
      res.json({ success: true, message: 'Allergy updated', data: allergy });
    } catch (error) {
      next(error);
    }
  },

  async deleteAllergy(req, res, next) {
    try {
      await intakeService.deleteAllergy(req.params.patientId, req.params.allergyId);
      res.json({ success: true, message: 'Allergy deleted' });
    } catch (error) {
      next(error);
    }
  },

  async setNkda(req, res, next) {
    try {
      const patient = await intakeService.setNkda(
        req.params.patientId,
        req.body.noKnownDrugAllergies,
      );
      res.json({ success: true, message: 'NKDA status updated', data: patient });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = intakeController;
