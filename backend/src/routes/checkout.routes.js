const express = require('express');
const router = express.Router({ mergeParams: true });
const checkoutController = require('../controllers/checkout.controller');
const {
  validate,
  checkoutQuerySchema,
  updateCheckoutSchema,
  instructionSchema,
  instructionIdSchema,
  noteSchema,
  taskSchema,
  paymentSchema,
  completeCheckoutSchema,
  reopenCheckoutSchema,
} = require('../validation/checkout.validation');

router.get('/', validate(checkoutQuerySchema, 'query'), checkoutController.getBundle);
router.get('/avs-preview', validate(checkoutQuerySchema, 'query'), checkoutController.previewAvs);

router.patch('/', validate(updateCheckoutSchema), checkoutController.update);

router.post('/instructions', validate(instructionSchema), checkoutController.upsertInstruction);
router.put(
  '/instructions/:instructionId',
  validate(instructionIdSchema, 'params'),
  validate(instructionSchema),
  checkoutController.upsertInstruction,
);
router.delete(
  '/instructions/:instructionId',
  validate(instructionIdSchema, 'params'),
  validate(checkoutQuerySchema, 'query'),
  checkoutController.deleteInstruction,
);

router.post('/notes', validate(noteSchema), checkoutController.addNote);
router.post('/tasks', validate(taskSchema), checkoutController.addTask);
router.post('/payments', validate(paymentSchema), checkoutController.recordPayment);

router.post('/complete', validate(completeCheckoutSchema), checkoutController.complete);
router.post('/reopen', validate(reopenCheckoutSchema), checkoutController.reopen);

module.exports = router;
