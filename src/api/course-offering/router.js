const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const {
  authorize,
  authorizeOwnerOrRoles,
} = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /course-offerings - Get all course offerings (all authenticated users)
router.get('/', controller.getAll);

// GET /course-offerings/lecturer/:lecturerId - Get offerings by lecturer
router.get(
  '/lecturer/:lecturerId',
  authorizeOwnerOrRoles('KAPRODI', 'DEKAN', 'LPM'),
  controller.getByLecturer,
);

// GET /course-offerings/:id - Get single course offering (all authenticated users)
router.get('/:id', controller.getById);

// POST /course-offerings - Create course offering (ADMIN, KAPRODI)
router.post('/', authorize('ADMIN', 'KAPRODI'), controller.create);

// PUT /course-offerings/:id - Update course offering (ADMIN, KAPRODI)
router.put('/:id', authorize('ADMIN', 'KAPRODI'), controller.update);

// DELETE /course-offerings/:id - Delete course offering (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
