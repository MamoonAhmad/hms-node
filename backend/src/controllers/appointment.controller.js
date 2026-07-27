const appointmentService = require('../services/appointment.service');
const appointmentAvailabilityService = require('../services/appointmentAvailability.service');
const pick = require('../utils/pick');

const appointmentController = {
  async create(req, res, next) {
    try {
      const appointment = await appointmentService.create(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: appointment,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 409) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.validatedQuery || req.query, [
        'page',
        'limit',
        'search',
        'status',
        'appointmentType',
        'department',
        'departmentId',
        'provider',
        'providerId',
        'date',
        'dateFrom',
        'dateTo',
        'patientId',
        'excludeHiddenTimeline',
      ]);

      const result = await appointmentService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getStatusCounts(req, res, next) {
    try {
      const filters = pick(req.validatedQuery || req.query, [
        'search',
        'appointmentType',
        'department',
        'departmentId',
        'provider',
        'providerId',
        'date',
        'dateFrom',
        'dateTo',
        'patientId',
      ]);
      const counts = await appointmentService.getStatusCounts(filters);
      res.json({ success: true, data: counts });
    } catch (error) {
      next(error);
    }
  },

  async getAvailableDates(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const result = await appointmentAvailabilityService.getAvailableDates(query.providerId, {
        appointmentType: query.appointmentType,
        departmentId: query.departmentId,
        fromDate: query.fromDate,
        daysAhead: query.daysAhead,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getAvailableSlots(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const dateStr =
        typeof query.date === 'string' ? query.date.split('T')[0] : query.date.toISOString().split('T')[0];
      const result = await appointmentAvailabilityService.getAvailableSlots(
        query.providerId,
        dateStr,
        {
          appointmentType: query.appointmentType,
          departmentId: query.departmentId,
          excludeAppointmentId: query.excludeAppointmentId,
        },
      );
      res.json({ success: true, data: result });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getTodayAppointments(req, res, next) {
    try {
      const appointments = await appointmentService.getTodayAppointments();
      res.json({ success: true, data: appointments });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }
      res.json({ success: true, data: appointment });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }
      const history = await appointmentService.getHistory(req.params.id);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      const updatedAppointment = await appointmentService.update(req.params.id, req.body, req.user);
      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: updatedAppointment,
      });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 409) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      await appointmentService.delete(req.params.id);
      res.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      const updatedAppointment = await appointmentService.update(
        req.params.id,
        { status: req.body.status },
        req.user,
      );
      res.json({
        success: true,
        message: 'Appointment status updated successfully',
        data: updatedAppointment,
      });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async checkIn(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      const updatedAppointment = await appointmentService.checkIn(req.params.id, req.user);
      res.json({
        success: true,
        message: 'Patient checked in successfully',
        data: updatedAppointment,
      });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async assignRoom(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      const updatedAppointment = await appointmentService.assignRoom(
        req.params.id,
        req.body.roomId,
        req.user,
      );
      res.json({
        success: true,
        message: 'Patient assigned to room successfully',
        data: updatedAppointment,
      });
    } catch (error) {
      if (error?.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = appointmentController;
