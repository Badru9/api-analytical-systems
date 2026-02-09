const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// GET /roles - Get all roles
router.get('/', controller.getAll);

// GET /roles/:id - Get single role
router.get('/:id', controller.getById);

// POST /roles - Create role
router.post('/', controller.create);

// PUT /roles/:id - Update role
router.put('/:id', controller.update);

// DELETE /roles/:id - Delete role
router.delete('/:id', controller.remove);

// POST /roles/assign - Assign role to user
router.post('/assign', controller.assignRole);

// POST /roles/remove - Remove role from user
router.post('/remove', controller.removeRole);

module.exports = router;
