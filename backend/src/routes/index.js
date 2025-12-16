const express = require('express');
const router = express.Router();

// Import route modules
const patientRoutes = require('./patient.routes');
const appointmentRoutes = require('./appointment.routes');

// Register routes
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);

module.exports = router;

