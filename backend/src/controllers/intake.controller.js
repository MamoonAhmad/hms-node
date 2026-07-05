const intakeService = require('../services/intake.service');
const pick = require('../utils/pick');

const intakeController = {
  async getSections(req, res, next) {
    try {
      const { appointmentId } = pick(req.validatedQuery || req.query, ['appointmentId']);
      const data = await intakeService.getSections(
        req.params.patientId,
        appointmentId || null,
        req.params.sectionKey,
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getAllSections(req, res, next) {
    try {
      const { appointmentId } = pick(req.validatedQuery || req.query, ['appointmentId']);
      const data = await intakeService.getSections(req.params.patientId, appointmentId || null);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async saveSection(req, res, next) {
    try {
      const { appointmentId, data, isAddendum, parentId } = req.body;
      const row = await intakeService.saveSection(
        req.params.patientId,
        appointmentId || null,
        req.params.sectionKey,
        data,
        req.user,
        { isAddendum, parentId },
      );
      res.status(201).json({ success: true, message: 'Section saved', data: row });
    } catch (error) {
      next(error);
    }
  },

  async getScreenings(req, res, next) {
    try {
      const { appointmentId } = pick(req.validatedQuery || req.query, ['appointmentId']);
      const data = await intakeService.getScreenings(
        req.params.patientId,
        appointmentId || null,
        req.params.screeningType,
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getAllScreenings(req, res, next) {
    try {
      const { appointmentId } = pick(req.validatedQuery || req.query, ['appointmentId']);
      const data = await intakeService.getScreenings(req.params.patientId, appointmentId || null);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async saveScreening(req, res, next) {
    try {
      const payload = req.body;
      const row = await intakeService.saveScreening(
        req.params.patientId,
        payload.appointmentId || null,
        payload,
        req.user,
      );
      res.status(201).json({ success: true, message: 'Screening saved', data: row });
    } catch (error) {
      next(error);
    }
  },

  async getCompletion(req, res, next) {
    try {
      const { appointmentId } = pick(req.validatedQuery || req.query, ['appointmentId']);
      const data = await intakeService.getCompletion(req.params.patientId, appointmentId || null);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async completeIntake(req, res, next) {
    try {
      const { appointmentId, intakeNotes, certificationAccepted } = req.body;
      const data = await intakeService.completeIntake(
        req.params.patientId,
        appointmentId || null,
        { intakeNotes, certificationAccepted },
        req.user,
      );
      res.json({ success: true, message: 'Intake completed', data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = intakeController;
