const patientService = require('../services/patient.service');
const patientSummaryService = require('../services/patientSummary.service');
const patientChartService = require('../services/patientChart.service');
const eligibilityService = require('../services/eligibility/eligibility.service');
const patientLedgerService = require('../services/patientLedger.service');
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

  async getSummary(req, res, next) {
    try {
      const filters = pick(req.query, ['encounterId', 'mrn']);
      const data = await patientSummaryService.getSummary(req.params.id, filters);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 400) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
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
  async listConsentForms(req, res, next) {
    try {
      const forms = await patientService.listRegistrationConsentForms(req.user?.id);
      res.json({
        success: true,
        data: forms,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAppointmentHistory(req, res, next) {
    try {
      const appointmentOpsService = require('../services/appointmentOps.service');
      const data = await appointmentOpsService.getPatientAppointmentHistory(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getChart(req, res, next) {
    try {
      const data = await patientChartService.getChart(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async updateChartStatus(req, res, next) {
    try {
      const data = await patientChartService.updateChartStatus(req.params.id, req.body, req.user?.id);
      res.json({ success: true, message: 'Chart status updated', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async verifyEligibility(req, res, next) {
    try {
      const row = await eligibilityService.verifyForPatient(req.params.id, req.body, req.user);
      res.status(201).json({ success: true, message: 'Eligibility verified', data: row });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async postLedgerPayment(req, res, next) {
    try {
      const data = await patientLedgerService.postTransaction({
        patientId: req.params.id,
        appointmentId: req.body.appointmentId || null,
        transactionType: req.body.transactionType || 'payment',
        amount: req.body.amount,
        description: req.body.description || 'Patient payment',
        paymentMethod: req.body.paymentMethod || null,
        referenceType: 'patient_chart',
        user: req.user,
        autoAllocate: req.body.autoAllocate !== false,
      });
      const ledger = await patientLedgerService.getPatientLedger(req.params.id);
      res.status(201).json({ success: true, message: 'Payment posted', data: { ...data, ledger } });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async reverseLedgerPayment(req, res, next) {
    try {
      const reversal = await patientLedgerService.reverseTransaction(
        req.params.txnId,
        req.user,
        req.body.reason,
      );
      const ledger = await patientLedgerService.getPatientLedger(req.params.id);
      res.json({ success: true, message: 'Transaction reversed', data: { reversal, ledger } });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async createStatement(req, res, next) {
    try {
      const data = await patientChartService.generateStatement(req.params.id, req.body, req.user);
      res.status(201).json({ success: true, message: 'Statement generated', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async markStatement(req, res, next) {
    try {
      const data = await patientChartService.markStatement(
        req.params.id,
        req.params.statementId,
        req.body.action,
        req.user,
      );
      res.json({ success: true, message: 'Statement updated', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async createClaim(req, res, next) {
    try {
      const data = await patientChartService.createClaim(req.params.id, req.body, req.user);
      res.status(201).json({ success: true, message: 'Claim created', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async updateClaim(req, res, next) {
    try {
      const data = await patientChartService.updateClaim(req.params.id, req.params.claimId, req.body);
      res.json({ success: true, message: 'Claim updated', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async postCharge(req, res, next) {
    try {
      const data = await patientLedgerService.postCharge({
        patientId: req.params.id,
        appointmentId: req.body.appointmentId || null,
        amount: req.body.amount,
        description: req.body.description || 'Patient charge',
        referenceType: req.body.referenceType || 'manual_charge',
        referenceId: req.body.referenceId || null,
        user: req.user,
      });
      const ledger = await patientLedgerService.getPatientLedger(req.params.id);
      res.status(201).json({ success: true, message: 'Charge posted', data: { ...data, ledger } });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async allocatePayment(req, res, next) {
    try {
      const data = await patientLedgerService.allocatePayment(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Payment allocated', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getAging(req, res, next) {
    try {
      const data = await patientLedgerService.getAging(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async postEra(req, res, next) {
    try {
      const data = await patientLedgerService.postEraPayment(req.params.id, req.body, req.user);
      res.status(201).json({ success: true, message: 'ERA payment posted', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async listInsurances(req, res, next) {
    try {
      const patientInsuranceService = require('../services/patientInsurance.service');
      const data = await patientInsuranceService.list(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async createInsurance(req, res, next) {
    try {
      const patientInsuranceService = require('../services/patientInsurance.service');
      const data = await patientInsuranceService.create(req.params.id, req.body, req.user);
      res.status(201).json({ success: true, message: 'Insurance added', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async updateInsurance(req, res, next) {
    try {
      const patientInsuranceService = require('../services/patientInsurance.service');
      const data = await patientInsuranceService.update(
        req.params.id,
        req.params.insuranceId,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Insurance updated', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async deactivateInsurance(req, res, next) {
    try {
      const patientInsuranceService = require('../services/patientInsurance.service');
      const data = await patientInsuranceService.deactivate(
        req.params.id,
        req.params.insuranceId,
        req.user,
      );
      res.json({ success: true, message: 'Insurance deactivated', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getGuarantor(req, res, next) {
    try {
      const patientGuarantorService = require('../services/patientGuarantor.service');
      const data = await patientGuarantorService.getForPatient(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async upsertGuarantor(req, res, next) {
    try {
      const patientGuarantorService = require('../services/patientGuarantor.service');
      const data = await patientGuarantorService.upsertForPatient(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Guarantor saved', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async mergePatient(req, res, next) {
    try {
      const patientMergeService = require('../services/patientMerge.service');
      const data = await patientMergeService.merge(
        req.body.sourcePatientId,
        req.params.id,
        req.user,
        req.body.notes,
      );
      res.json({ success: true, message: 'Patients merged', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getWorklists(req, res, next) {
    try {
      const patientWorklistService = require('../services/patientWorklist.service');
      const query = req.validatedQuery || req.query;
      const data = await patientWorklistService.getWorklists(query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateCollectionStatus(req, res, next) {
    try {
      const patientWorklistService = require('../services/patientWorklist.service');
      const data = await patientWorklistService.updateCollectionStatus(
        req.params.id,
        req.body,
        req.user,
      );
      res.json({ success: true, message: 'Collection status updated', data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getLedger(req, res, next) {
    try {
      const data = await patientLedgerService.getPatientLedger(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = patientController;
