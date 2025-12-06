const patientService = require('../services/patient.service');
const pick = require('../utils/pick');

const patientController = {
  /**
   * @swagger
   * /api/patients:
   *   post:
   *     summary: Create a new patient
   *     tags: [Patients]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePatient'
   *     responses:
   *       201:
   *         description: Patient created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Patient'
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
  async create(req, res, next) {
    try {
      const patient = await patientService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/patients:
   *   get:
   *     summary: Get all patients with pagination
   *     tags: [Patients]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name, MRN, or email
   *       - in: query
   *         name: gender
   *         schema:
   *           type: string
   *           enum: [male, female, other]
   *         description: Filter by gender
   *       - in: query
   *         name: insuranceProvider
   *         schema:
   *           type: string
   *         description: Filter by insurance provider
   *     responses:
   *       200:
   *         description: List of patients
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Patient'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   */
  async findAll(req, res, next) {
    try {
      // Pick only allowed query parameters
      const filters = pick(req.query, ['page', 'limit', 'search', 'gender', 'insuranceProvider']);
      
      const result = await patientService.findAll(filters);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/patients/{id}:
   *   get:
   *     summary: Get a patient by ID
   *     tags: [Patients]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient ID
   *     responses:
   *       200:
   *         description: Patient details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Patient'
   *       404:
   *         description: Patient not found
   */
  async findById(req, res, next) {
    try {
      const patient = await patientService.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }
      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/patients/mrn/{mrn}:
   *   get:
   *     summary: Get a patient by MRN (Medical Record Number)
   *     tags: [Patients]
   *     parameters:
   *       - in: path
   *         name: mrn
   *         required: true
   *         schema:
   *           type: string
   *         description: Medical Record Number
   *     responses:
   *       200:
   *         description: Patient details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Patient'
   *       404:
   *         description: Patient not found
   */
  async findByMrn(req, res, next) {
    try {
      const patient = await patientService.findByMrn(req.params.mrn);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }
      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/patients/{id}:
   *   put:
   *     summary: Update a patient
   *     tags: [Patients]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdatePatient'
   *     responses:
   *       200:
   *         description: Patient updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Patient'
   *       404:
   *         description: Patient not found
   */
  async update(req, res, next) {
    try {
      const patient = await patientService.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }

      const updatedPatient = await patientService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Patient updated successfully',
        data: updatedPatient,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/patients/{id}:
   *   delete:
   *     summary: Delete a patient
   *     tags: [Patients]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient ID
   *     responses:
   *       200:
   *         description: Patient deleted successfully
   *       404:
   *         description: Patient not found
   */
  async delete(req, res, next) {
    try {
      const patient = await patientService.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }

      await patientService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Patient deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = patientController;
