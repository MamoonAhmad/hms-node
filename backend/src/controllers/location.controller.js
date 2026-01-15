const locationService = require('../services/location.service');
const pick = require('../utils/pick');

const locationController = {
  /**
   * @swagger
   * /api/locations:
   *   post:
   *     summary: Create a new location
   *     tags: [Locations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateLocation'
   *     responses:
   *       201:
   *         description: Location created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Location'
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
  async create(req, res, next) {
    try {
      const location = await locationService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Location created successfully',
        data: location,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/locations:
   *   get:
   *     summary: Get all locations with pagination
   *     tags: [Locations]
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
   *         description: Search by name, city, state, or country
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - in: query
   *         name: tenantId
   *         schema:
   *           type: string
   *         description: Filter by tenant ID
   *     responses:
   *       200:
   *         description: List of locations
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
   *                     $ref: '#/components/schemas/Location'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   */
  async findAll(req, res, next) {
    try {
      // Pick only allowed query parameters
      const filters = pick(req.query, ['page', 'limit', 'search', 'isActive', 'tenantId']);
      
      const result = await locationService.findAll(filters);
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
   * /api/locations/{id}:
   *   get:
   *     summary: Get a location by ID
   *     tags: [Locations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Location ID
   *     responses:
   *       200:
   *         description: Location details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Location'
   *       404:
   *         description: Location not found
   */
  async findById(req, res, next) {
    try {
      const location = await locationService.findById(req.params.id);
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found',
        });
      }
      res.json({
        success: true,
        data: location,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/locations/{id}:
   *   put:
   *     summary: Update a location
   *     tags: [Locations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Location ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateLocation'
   *     responses:
   *       200:
   *         description: Location updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Location'
   *       404:
   *         description: Location not found
   */
  async update(req, res, next) {
    try {
      const location = await locationService.findById(req.params.id);
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found',
        });
      }

      const updatedLocation = await locationService.update(req.params.id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Location updated successfully',
        data: updatedLocation,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/locations/{id}:
   *   delete:
   *     summary: Delete a location
   *     tags: [Locations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Location ID
   *     responses:
   *       200:
   *         description: Location deleted successfully
   *       404:
   *         description: Location not found
   */
  async delete(req, res, next) {
    try {
      const location = await locationService.findById(req.params.id);
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found',
        });
      }

      await locationService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Location deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = locationController;

