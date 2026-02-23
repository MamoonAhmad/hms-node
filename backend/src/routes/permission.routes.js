const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const {
  createPermissionSchema,
  updatePermissionSchema,
  queryPermissionSchema,
  permissionIdSchema,
  validate,
} = require('../validation/permission.validation');

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Permission management endpoints
 */

// Create a new permission
router.post('/', validate(createPermissionSchema, 'body'), permissionController.create);

// Get all permissions with pagination
router.get('/', validate(queryPermissionSchema, 'query'), permissionController.findAll);

// Get permission by ID
router.get('/:id', validate(permissionIdSchema, 'params'), permissionController.findById);

// Update permission
router.put('/:id', validate(permissionIdSchema, 'params'), validate(updatePermissionSchema, 'body'), permissionController.update);

// Delete permission
router.delete('/:id', validate(permissionIdSchema, 'params'), permissionController.delete);

module.exports = router;

