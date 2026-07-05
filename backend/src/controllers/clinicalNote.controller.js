const clinicalNoteService = require('../services/clinicalNote.service');

const clinicalNoteController = {
  patientId(req) {
    return req.params.id || req.params.patientId;
  },

  async getChartContext(req, res, next) {
    try {
      const data = await clinicalNoteService.getChartContext(clinicalNoteController.patientId(req), req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const data = await clinicalNoteService.findAll(clinicalNoteController.patientId(req), req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await clinicalNoteService.findById(
        clinicalNoteController.patientId(req),
        req.params.noteId,
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const data = await clinicalNoteService.create(
        clinicalNoteController.patientId(req),
        req.body,
        req.user,
      );
      res.status(201).json({ success: true, message: 'Note created', data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await clinicalNoteService.update(
        clinicalNoteController.patientId(req),
        req.params.noteId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Note saved', data });
    } catch (error) {
      next(error);
    }
  },

  async sign(req, res, next) {
    try {
      const data = await clinicalNoteService.sign(
        clinicalNoteController.patientId(req),
        req.params.noteId,
        req.user,
      );
      res.json({ success: true, message: 'Note signed', data });
    } catch (error) {
      next(error);
    }
  },

  async addAddendum(req, res, next) {
    try {
      const data = await clinicalNoteService.addAddendum(
        clinicalNoteController.patientId(req),
        req.params.noteId,
        req.body,
        req.user,
      );
      res.status(201).json({ success: true, message: 'Addendum saved', data });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      await clinicalNoteService.remove(
        clinicalNoteController.patientId(req),
        req.params.noteId,
        req.user,
      );
      res.json({ success: true, message: 'Note deleted' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = clinicalNoteController;
