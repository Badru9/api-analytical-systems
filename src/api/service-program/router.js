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

// GET /service-programs - Get all service programs
router.get('/', controller.getAll);

// GET /service-programs/lecturer/:lecturerId - Get by lecturer
router.get(
  '/lecturer/:lecturerId',
  authorizeOwnerOrRoles('KAPRODI', 'DEKAN', 'LPPM', 'LPM'),
  controller.getByLecturer,
);

// GET /service-programs/:id - Get single service program
router.get('/:id', controller.getById);

// POST /service-programs - Create service program
router.post(
  '/',
  authorize('ADMIN', 'KAPRODI', 'LPPM', 'DOSEN'),
  controller.create,
);

// PUT /service-programs/:id - Update service program
router.put(
  '/:id',
  authorize('ADMIN', 'KAPRODI', 'LPPM', 'DOSEN'),
  controller.update,
);

// DELETE /service-programs/:id - Delete service program
router.delete('/:id', authorize('ADMIN', 'LPPM'), controller.remove);

module.exports = router;
