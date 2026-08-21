const appointmentService = require('../services/appointment.service');
const appointmentAvailabilityService = require('../services/appointmentAvailability.service');
const appointmentLifecycleService = require('../services/appointmentLifecycle.service');
const appointmentWorkflowService = require('../services/appointmentWorkflow.service');
const appointmentOpsService = require('../services/appointmentOps.service');
const eligibilityService = require('../services/eligibility/eligibility.service');
const patientLedgerService = require('../services/patientLedger.service');
const priorAuthorizationService = require('../services/priorAuthorization.service');
const notificationService = require('../services/notification.service');
const pick = require('../utils/pick');

function handleLifecycleError(error, res, next) {
  if (error?.statusCode === 400 || error?.statusCode === 404 || error?.statusCode === 409) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
}

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

  async getPolicy(req, res, next) {
    try {
      const policy = await appointmentLifecycleService.getPolicy();
      res.json({ success: true, data: policy });
    } catch (error) {
      next(error);
    }
  },

  async updatePolicy(req, res, next) {
    try {
      const data = await appointmentOpsService.updatePolicy(req.body, req.user);
      res.json({ success: true, message: 'Appointment policy updated', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async getReasonCodes(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const data = await appointmentLifecycleService.getReasonCodes(query.category || undefined);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getPolicyPreview(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const data = await appointmentLifecycleService.getPolicyPreview(req.params.id, query.action);
      res.json({ success: true, data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async cancel(req, res, next) {
    try {
      const data = await appointmentLifecycleService.cancel(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Appointment cancelled', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async markNoShow(req, res, next) {
    try {
      const data = await appointmentLifecycleService.markNoShow(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Appointment marked as no-show', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async reschedule(req, res, next) {
    try {
      const data = await appointmentLifecycleService.reschedule(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Appointment rescheduled', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
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
      const updatedAppointment = await appointmentWorkflowService.transition(
        req.params.id,
        req.body.status,
        req.user,
      );
      res.json({
        success: true,
        message: 'Appointment status updated successfully',
        data: updatedAppointment,
      });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async verifyEligibility(req, res, next) {
    try {
      const data = await eligibilityService.verifyForAppointment(
        req.params.id,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Eligibility verified', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async getEligibility(req, res, next) {
    try {
      const latest = await eligibilityService.getLatest(req.params.id);
      const history = await eligibilityService.listForAppointment(req.params.id);
      res.json({ success: true, data: { latest, history } });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async setCoverage(req, res, next) {
    try {
      const data = await appointmentOpsService.setCoverage(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Coverage updated', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async confirm(req, res, next) {
    try {
      const data = await appointmentWorkflowService.confirm(req.params.id, req.user);
      res.json({ success: true, message: 'Appointment confirmed', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async markArrived(req, res, next) {
    try {
      const data = await appointmentWorkflowService.markArrived(req.params.id, req.user);
      res.json({ success: true, message: 'Patient marked arrived', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async checkIn(req, res, next) {
    try {
      const data = await appointmentWorkflowService.checkIn(req.params.id, req.body || {}, req.user);
      res.json({ success: true, message: 'Patient checked in', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async markReady(req, res, next) {
    try {
      const data = await appointmentWorkflowService.markReady(req.params.id, req.user);
      res.json({ success: true, message: 'Patient ready for visit', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async startVisit(req, res, next) {
    try {
      const data = await appointmentWorkflowService.startVisit(req.params.id, req.user);
      res.json({ success: true, message: 'Visit started', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async complete(req, res, next) {
    try {
      const data = await appointmentWorkflowService.complete(req.params.id, req.user);
      res.json({ success: true, message: 'Visit completed', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async checkOut(req, res, next) {
    try {
      const data = await appointmentWorkflowService.checkout(req.params.id, req.body || {}, req.user);
      res.json({ success: true, message: 'Checkout complete', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async collectPayment(req, res, next) {
    try {
      const data = await appointmentWorkflowService.collectPayment(
        req.params.id,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Payment collected', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async getLedger(req, res, next) {
    try {
      const data = await patientLedgerService.getAppointmentLedger(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async createAuthorization(req, res, next) {
    try {
      const data = await priorAuthorizationService.create(req.params.id, req.body, req.user);
      res.status(201).json({ success: true, message: 'Authorization saved', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async getAuthorizations(req, res, next) {
    try {
      const data = await priorAuthorizationService.listForAppointment(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async updateAuthorization(req, res, next) {
    try {
      const data = await priorAuthorizationService.update(req.params.authId, req.body, req.user);
      res.json({ success: true, message: 'Authorization updated', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async sendNotification(req, res, next) {
    try {
      const data = await notificationService.notifyAppointmentEvent(
        req.params.id,
        req.body.eventKey || 'appointment.reminder',
        req.body.variables || {},
      );
      res.json({ success: true, message: 'Notification queued', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async getNotifications(req, res, next) {
    try {
      const data = await notificationService.listForAppointment(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async assignRoom(req, res, next) {
    try {
      const data = await appointmentOpsService.assignRoom(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Room assigned', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async releaseRoom(req, res, next) {
    try {
      const data = await appointmentOpsService.releaseRoom(req.params.id, req.user);
      res.json({ success: true, message: 'Room released', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async upsertTelehealth(req, res, next) {
    try {
      const data = await appointmentOpsService.upsertTelehealth(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Telehealth details saved', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async createReferral(req, res, next) {
    try {
      const data = await appointmentOpsService.createReferral(req.params.id, req.body, req.user);
      res.status(201).json({ success: true, message: 'Referral recorded', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async createRecurring(req, res, next) {
    try {
      const data = await appointmentOpsService.createRecurringSeries(req.body, req.user);
      res.status(201).json({ success: true, message: 'Recurring series created', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async getWeekCalendar(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const data = await appointmentOpsService.getWeekCalendar(query);
      res.json({ success: true, ...data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async runAutoNoShow(req, res, next) {
    try {
      const data = await appointmentOpsService.autoNoShow(req.user);
      res.json({ success: true, message: 'Auto no-show job completed', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async getReports(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const data = await appointmentOpsService.getReports(query);
      res.json({ success: true, data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async listRooms(req, res, next) {
    try {
      const data = await appointmentOpsService.listRooms();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async selfSchedule(req, res, next) {
    try {
      const data = await appointmentOpsService.selfSchedule(req.body, req.user);
      res.status(201).json({ success: true, message: 'Self-scheduled appointment created', data });
    } catch (error) {
      return handleLifecycleError(error, res, next);
    }
  },

  async getAllowedTransitions(req, res, next) {
    try {
      const appointment = await appointmentService.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }
      res.json({
        success: true,
        data: {
          current: appointment.status,
          allowed: appointmentWorkflowService.getAllowedTransitions(appointment.status),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = appointmentController;
