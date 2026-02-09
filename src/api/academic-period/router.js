const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /academic-periods - Get all academic periods (all authenticated users)
router.get('/', controller.getAll);

// GET /academic-periods/current - Get current academic period (all authenticated users)
router.get('/current', controller.getCurrent);

// GET /academic-periods/:id - Get single academic period (all authenticated users)
router.get('/:id', controller.getById);

// POST /academic-periods - Create academic period (ADMIN only)
router.post('/', authorize('ADMIN'), controller.create);

// PUT /academic-periods/:id - Update academic period (ADMIN only)
router.put('/:id', authorize('ADMIN'), controller.update);

// DELETE /academic-periods/:id - Delete academic period (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
