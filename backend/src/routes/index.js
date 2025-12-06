const express = require('express');
const router = express.Router();

// Import route modules
const patientRoutes = require('./patient.routes');

// Register routes
router.use('/patients', patientRoutes);

module.exports = router;

