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
      const patient = await patientService.create(req.body, req.user?.id);
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
      const filters = pick(req.query, [
        'page',
        'limit',
        'search',
        'gender',
        'insuranceProviderId',
        'insuranceProviderIds',
        'insurancePayerIds',
        'mrn',
        'firstName',
        'lastName',
        'dateFrom',
        'dateTo',
        'registrationStatus',
        'consentForm',
        'insuranceType',
        'providerIds',
        'departmentId',
        'listTab',
      ]);

      if (filters.listTab === 'my_list' && req.user?.id) {
        filters.assignedToId = req.user.id;
      }

      if (filters.gender === 'm') filters.gender = 'male';
      if (filters.gender === 'f') filters.gender = 'female';

      const result = await patientService.findAll(filters);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async checkDuplicates(req, res, next) {
    try {
      const result = await patientService.checkDuplicates(req.body);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async assignToMe(req, res, next) {
    try {
      const patient = await patientService.assignToMe(req.params.id, req.user?.id);
      res.json({
        success: true,
        message: 'Patient assigned successfully',
        data: patient,
      });
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
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

      const updatedPatient = await patientService.update(req.params.id, req.body, req.user?.id);
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

      await patientService.delete(req.params.id, req.user?.id);
      res.json({
        success: true,
        message: 'Patient deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async getEncounters(req, res, next) {
    try {
      const data = await patientService.getEncounters(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async listDocuments(req, res, next) {
    try {
      const result = await patientService.listDocuments(req.params.id, req.query);
      res.json({ success: true, data: result.documents, summary: result.summary });
    } catch (error) {
      next(error);
    }
  },

  async createDocument(req, res, next) {
    try {
      const data = await patientService.createDocument(req.params.id, req.body, req.user?.id);
      res.status(201).json({ success: true, data, message: 'Document uploaded successfully.' });
    } catch (error) {
      next(error);
    }
  },

  async getDocumentVersions(req, res, next) {
    try {
      const data = await patientService.getDocumentVersions(req.params.id, req.params.documentId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async replaceDocument(req, res, next) {
    try {
      const data = await patientService.replaceDocument(
        req.params.id,
        req.params.documentId,
        req.body,
        req.user?.id,
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateDocumentStatus(req, res, next) {
    try {
      const data = await patientService.updateDocumentStatus(
        req.params.id,
        req.params.documentId,
        req.body.status,
        req.user?.id,
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async logDocumentAudit(req, res, next) {
    try {
      const data = await patientService.logDocumentAudit(
        req.params.id,
        req.params.documentId,
        req.body.action,
        req.user?.id,
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateDocument(req, res, next) {
    try {
      const data = await patientService.updateDocument(
        req.params.id,
        req.params.documentId,
        req.body,
        req.user?.id,
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async deleteDocument(req, res, next) {
    try {
      await patientService.deleteDocument(req.params.id, req.params.documentId, req.user?.id);
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async getTimeline(req, res, next) {
    try {
      const data = await patientService.getTimeline(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getSummary(req, res, next) {
    try {
      const data = await patientService.getSummary(req.params.id, {
        encounterId: req.query.encounterId,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async deleteWithConfirmation(req, res, next) {
    try {
      await patientService.deleteWithConfirmation(req.params.id, req.body, req.user?.id);
      res.json({ success: true, message: 'Patient deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = patientController;
