const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /faculties - Get all faculties (all authenticated users)
router.get('/', controller.getAll);

// GET /faculties/:id - Get single faculty (all authenticated users)
router.get('/:id', controller.getById);

// POST /faculties - Create faculty (ADMIN, DEKAN)
router.post('/', authorize('ADMIN', 'DEKAN'), controller.create);

// PUT /faculties/:id - Update faculty (ADMIN, DEKAN)
router.put('/:id', authorize('ADMIN', 'DEKAN'), controller.update);

// DELETE /faculties/:id - Delete faculty (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
