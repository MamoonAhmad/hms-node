const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlist.controller');
const {
  createWaitlistSchema,
  updateWaitlistSchema,
  queryWaitlistSchema,
  statusCountsQuerySchema,
  matchesQuerySchema,
  offerSchema,
  bookSchema,
  declineOfferSchema,
  closeSchema,
  waitlistIdSchema,
  validate,
} = require('../validation/waitlist.validation');

router.post('/', validate(createWaitlistSchema, 'body'), waitlistController.create);
router.get('/', validate(queryWaitlistSchema, 'query'), waitlistController.findAll);
router.get(
  '/status-counts',
  validate(statusCountsQuerySchema, 'query'),
  waitlistController.getStatusCounts,
);
router.get('/matches', validate(matchesQuerySchema, 'query'), waitlistController.findMatches);
router.post('/expire-stale', waitlistController.expireStale);

router.get('/:id/events', validate(waitlistIdSchema, 'params'), waitlistController.getEvents);
router.get('/:id', validate(waitlistIdSchema, 'params'), waitlistController.findById);
router.put(
  '/:id',
  validate(waitlistIdSchema, 'params'),
  validate(updateWaitlistSchema, 'body'),
  waitlistController.update,
);
router.post(
  '/:id/offer',
  validate(waitlistIdSchema, 'params'),
  validate(offerSchema, 'body'),
  waitlistController.offer,
);
router.post(
  '/:id/accept-offer',
  validate(waitlistIdSchema, 'params'),
  waitlistController.acceptOffer,
);
router.post(
  '/:id/decline-offer',
  validate(waitlistIdSchema, 'params'),
  validate(declineOfferSchema, 'body'),
  waitlistController.declineOffer,
);
router.post(
  '/:id/book',
  validate(waitlistIdSchema, 'params'),
  validate(bookSchema, 'body'),
  waitlistController.book,
);
router.post(
  '/:id/cancel',
  validate(waitlistIdSchema, 'params'),
  validate(closeSchema, 'body'),
  waitlistController.cancel,
);
router.post(
  '/:id/remove',
  validate(waitlistIdSchema, 'params'),
  validate(closeSchema, 'body'),
  waitlistController.remove,
);

module.exports = router;
