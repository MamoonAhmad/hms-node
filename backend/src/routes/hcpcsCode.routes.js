const express = require('express');
const router = express.Router();
const hcpcsCodeController = require('../controllers/hcpcsCode.controller');
const {
  createHcpcsCodeSchema,
  updateHcpcsCodeSchema,
  queryHcpcsCodeSchema,
  hcpcsCodeIdSchema,
  validate,
} = require('../validation/hcpcsCode.validation');

router.post('/', validate(createHcpcsCodeSchema, 'body'), hcpcsCodeController.create);
router.get('/', validate(queryHcpcsCodeSchema, 'query'), hcpcsCodeController.findAll);
router.get('/:id', validate(hcpcsCodeIdSchema, 'params'), hcpcsCodeController.findById);
router.put(
  '/:id',
  validate(hcpcsCodeIdSchema, 'params'),
  validate(updateHcpcsCodeSchema, 'body'),
  hcpcsCodeController.update,
);
router.delete('/:id', validate(hcpcsCodeIdSchema, 'params'), hcpcsCodeController.delete);

module.exports = router;
