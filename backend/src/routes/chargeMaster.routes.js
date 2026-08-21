const express = require('express');
const router = express.Router();
const rcmController = require('../controllers/rcm.controller');
const {
  createChargeMasterSchema,
  updateChargeMasterSchema,
  queryChargeMasterSchema,
  chargeMasterIdSchema,
  searchChargeMasterSchema,
  validate,
} = require('../validation/chargeMaster.validation');

router.get('/', validate(queryChargeMasterSchema, 'query'), rcmController.listChargeMaster);
router.get('/search', validate(searchChargeMasterSchema, 'query'), rcmController.searchCharges);
router.get('/:id', validate(chargeMasterIdSchema, 'params'), rcmController.getChargeMaster);
router.post('/', validate(createChargeMasterSchema, 'body'), rcmController.createChargeMaster);
router.put(
  '/:id',
  validate(chargeMasterIdSchema, 'params'),
  validate(updateChargeMasterSchema, 'body'),
  rcmController.updateChargeMaster,
);
router.delete('/:id', validate(chargeMasterIdSchema, 'params'), rcmController.deleteChargeMaster);

module.exports = router;
