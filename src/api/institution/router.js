const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /institutions - Get all institutions (all authenticated users)
router.get('/', controller.getAll);

// GET /institutions/:id - Get single institution (all authenticated users)
router.get('/:id', controller.getById);

// POST /institutions - Create institution (ADMIN only)
router.post('/', authorize('ADMIN'), controller.create);

// PUT /institutions/:id - Update institution (ADMIN only)
router.put('/:id', authorize('ADMIN'), controller.update);

// DELETE /institutions/:id - Delete institution (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
