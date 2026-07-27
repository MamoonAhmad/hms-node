const express = require('express');
const router = express.Router();
const chargeMasterController = require('../controllers/chargeMaster.controller');
const {
  createChargeMasterSchema,
  updateChargeMasterSchema,
  queryChargeMasterSchema,
  chargeMasterIdSchema,
  validate,
} = require('../validation/chargeMaster.validation');

router.post('/', validate(createChargeMasterSchema, 'body'), chargeMasterController.create);
router.get('/', validate(queryChargeMasterSchema, 'query'), chargeMasterController.findAll);
router.get('/:id', validate(chargeMasterIdSchema, 'params'), chargeMasterController.findById);
router.put(
  '/:id',
  validate(chargeMasterIdSchema, 'params'),
  validate(updateChargeMasterSchema, 'body'),
  chargeMasterController.update,
);
router.delete('/:id', validate(chargeMasterIdSchema, 'params'), chargeMasterController.delete);

module.exports = router;
