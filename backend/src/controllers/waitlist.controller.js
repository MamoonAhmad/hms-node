const waitlistService = require('../services/waitlist.service');
const pick = require('../utils/pick');

function handleError(error, res, next) {
  if (error?.statusCode === 400 || error?.statusCode === 404 || error?.statusCode === 409) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
}

const waitlistController = {
  async create(req, res, next) {
    try {
      const entry = await waitlistService.create(req.body, req.user);
      res.status(201).json({ success: true, message: 'Added to waitlist', data: entry });
    } catch (error) {
      return handleError(error, res, next);
    }
  },

  async findAll(req, res, next) {
    try {
      const filters = pick(req.validatedQuery || req.query, [
        'page',
        'limit',
        'search',
        'status',
        'priority',
        'patientId',
        'preferredProviderId',
        'preferredDepartmentId',
        'appointmentTypeId',
        'dateFrom',
        'dateTo',
        'activeOnly',
      ]);
      const result = await waitlistService.findAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getStatusCounts(req, res, next) {
    try {
      const filters = pick(req.validatedQuery || req.query, [
        'search',
        'priority',
        'patientId',
        'preferredProviderId',
        'preferredDepartmentId',
        'appointmentTypeId',
        'dateFrom',
        'dateTo',
      ]);
      const data = await waitlistService.getStatusCounts(filters);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findMatches(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const data = await waitlistService.findMatches(query);
      res.json({ success: true, ...data });
    } catch (error) {
      return handleError(error, res, next);
    }
  },

  async expireStale(req, res, next) {
    try {
      const data = await waitlistService.expireStaleOffers(req.user);
      res.json({ success: true, message: 'Expired stale offers processed', data });
    } catch (error) {
      return handleError(error, res, next);
    }
  },

  async findById(req, res, next) {
    try {
      const entry = await waitlistService.findById(req.params.id);
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Waitlist entry not found' });
      }
      res.json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  },

  async getEvents(req, res, next) {
    try {
      const events = await waitlistService.getEvents(req.params.id);
      if (!events) {
        return res.status(404).json({ success: false, message: 'Waitlist entry not found' });
      }
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const entry = await waitlistService.update(req.params.id, req.body, req.user);
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Waitlist entry not found' });
      }
      res.json({ success: true, message: 'Waitlist entry updated', data: entry });
    } catch (error) {
      return handleError(error, res, next);
    }
  },

  async offer(req, res, next) {
    try {
      const data = await waitlistService.offer(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Slot offered', data });
    } catch (error) {
      return handleError(error, res, next);
    }
  },

  async acceptOffer(req, res, next) {
    try {
      const data = await waitlistService.acceptOffer(req.params.id, req.body || {}, req.user);
      res.json({ success: true, message: 'Offer accepted and appointment booked', data });
    } catch (error) {
      return handleError(error, res, next);
    }
  },

  async declineOffer(req, res, next) {
    try {
      const data = await waitlistService.declineOffer(req.params.id, req.body || {}, req.user);
      res.json({ success: true, message: 'Offer declined', data });
    } catch (error) {
      return handleError(error, res, next);
    }
  },

  async book(req, res, next) {
    try {
      const data = await waitlistService.book(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Appointment booked from waitlist', data });
    } catch (error) {
      return handleError(error, res, next);
    }
  },

  async cancel(req, res, next) {
    try {
      const data = await waitlistService.cancel(req.params.id, req.body || {}, req.user);
      res.json({ success: true, message: 'Waitlist entry cancelled', data });
    } catch (error) {
      return handleError(error, res, next);
    }
  },

  async remove(req, res, next) {
    try {
      const data = await waitlistService.remove(req.params.id, req.body || {}, req.user);
      res.json({ success: true, message: 'Waitlist entry removed', data });
    } catch (error) {
      return handleError(error, res, next);
    }
  },
};

module.exports = waitlistController;
