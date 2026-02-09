const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /evidence-types - Get all evidence types
router.get('/', controller.getAll);

// GET /evidence-types/:id - Get single evidence type
router.get('/:id', controller.getById);

// POST /evidence-types - Create evidence type (ADMIN only)
router.post('/', authorize('ADMIN'), controller.create);

// PUT /evidence-types/:id - Update evidence type (ADMIN only)
router.put('/:id', authorize('ADMIN'), controller.update);

// DELETE /evidence-types/:id - Delete evidence type (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
