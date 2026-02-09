const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /courses - Get all courses (all authenticated users)
router.get('/', controller.getAll);

// GET /courses/:id - Get single course (all authenticated users)
router.get('/:id', controller.getById);

// POST /courses - Create course (ADMIN, KAPRODI)
router.post('/', authorize('ADMIN', 'KAPRODI'), controller.create);

// PUT /courses/:id - Update course (ADMIN, KAPRODI)
router.put('/:id', authorize('ADMIN', 'KAPRODI'), controller.update);

// DELETE /courses/:id - Delete course (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
