const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const {
  createRoleSchema,
  updateRoleSchema,
  queryRoleSchema,
  roleIdSchema,
  validate,
} = require('../validation/role.validation');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management endpoints
 */

// Create a new role
router.post('/', validate(createRoleSchema, 'body'), roleController.create);

// Get all roles with pagination
router.get('/', validate(queryRoleSchema, 'query'), roleController.findAll);

// Get role by ID
router.get('/:id', validate(roleIdSchema, 'params'), roleController.findById);

// Update role
router.put('/:id', validate(roleIdSchema, 'params'), validate(updateRoleSchema, 'body'), roleController.update);

// Delete role
router.delete('/:id', validate(roleIdSchema, 'params'), roleController.delete);

module.exports = router;
