const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /academic-years - Get all academic years (all authenticated users)
router.get('/', controller.getAll);

// GET /academic-years/current - Get current academic year (all authenticated users)
router.get('/current', controller.getCurrent);

// GET /academic-years/:id - Get single academic year (all authenticated users)
router.get('/:id', controller.getById);

// POST /academic-years - Create academic year (ADMIN only)
router.post('/', authorize('ADMIN'), controller.create);

// PUT /academic-years/:id - Update academic year (ADMIN only)
router.put('/:id', authorize('ADMIN'), controller.update);

// DELETE /academic-years/:id - Delete academic year (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
