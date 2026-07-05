const express = require('express');
const router = express.Router();
const encountersWorkListController = require('../controllers/encountersWorkList.controller');
const {
  queryEncountersWorkListSchema,
  validate,
} = require('../validation/encountersWorkList.validation');

router.get('/', validate(queryEncountersWorkListSchema, 'query'), encountersWorkListController.findAll);

module.exports = router;
