const insuranceProviderService = require('../services/insuranceProvider.service');
const pick = require('../utils/pick');

const insuranceProviderController = {
  /**
   * @swagger
   * /api/insurance-providers:
   *   post:
   *     summary: Create a new insurance provider
   *     tags: [Insurance Providers]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateInsuranceProvider'
   *     responses:
   *       201:
   *         description: Insurance provider created successfully
   *       400:
   *         description: Validation error
   */
  async create(req, res, next) {
    try {
      const provider = await insuranceProviderService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Insurance provider created successfully',
        data: provider,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/insurance-providers:
   *   get:
   *     summary: Get all insurance providers with pagination
   *     tags: [Insurance Providers]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: List of insurance providers
   */
  async findAll(req, res, next) {
    try {
      const filters = pick(req.query, ['page', 'limit', 'search', 'isActive']);
      const result = await insuranceProviderService.findAll(filters);
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
   * /api/insurance-providers/active:
   *   get:
   *     summary: Get all active insurance providers (for dropdowns)
   *     tags: [Insurance Providers]
   *     responses:
   *       200:
   *         description: List of active insurance providers
   */
  async findAllActive(req, res, next) {
    try {
      const providers = await insuranceProviderService.findAllActive();
      res.json({
        success: true,
        data: providers,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/insurance-providers/{id}:
   *   get:
   *     summary: Get an insurance provider by ID
   *     tags: [Insurance Providers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Insurance provider details
   *       404:
   *         description: Insurance provider not found
   */
  async findById(req, res, next) {
    try {
      const provider = await insuranceProviderService.findById(req.params.id);
      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Insurance provider not found',
        });
      }
      res.json({
        success: true,
        data: provider,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/insurance-providers/{id}:
   *   put:
   *     summary: Update an insurance provider
   *     tags: [Insurance Providers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateInsuranceProvider'
   *     responses:
   *       200:
   *         description: Insurance provider updated successfully
   *       404:
   *         description: Insurance provider not found
   */
  async update(req, res, next) {
    try {
      const provider = await insuranceProviderService.findById(req.params.id);
      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Insurance provider not found',
        });
      }

      const updatedProvider = await insuranceProviderService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Insurance provider updated successfully',
        data: updatedProvider,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/insurance-providers/{id}:
   *   delete:
   *     summary: Delete an insurance provider
   *     tags: [Insurance Providers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Insurance provider deleted successfully
   *       404:
   *         description: Insurance provider not found
   */
  async delete(req, res, next) {
    try {
      const provider = await insuranceProviderService.findById(req.params.id);
      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Insurance provider not found',
        });
      }

      await insuranceProviderService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Insurance provider deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = insuranceProviderController;

