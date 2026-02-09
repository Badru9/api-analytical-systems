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

// GET /research-projects - Get all research projects
router.get('/', controller.getAll);

// GET /research-projects/lecturer/:lecturerId - Get by lecturer
router.get(
  '/lecturer/:lecturerId',
  authorizeOwnerOrRoles('KAPRODI', 'DEKAN', 'LPPM', 'LPM'),
  controller.getByLecturer,
);

// GET /research-projects/:id - Get single research project
router.get('/:id', controller.getById);

// POST /research-projects - Create research project
router.post(
  '/',
  authorize('ADMIN', 'KAPRODI', 'LPPM', 'DOSEN'),
  controller.create,
);

// PUT /research-projects/:id - Update research project
router.put(
  '/:id',
  authorize('ADMIN', 'KAPRODI', 'LPPM', 'DOSEN'),
  controller.update,
);

// DELETE /research-projects/:id - Delete research project
router.delete('/:id', authorize('ADMIN', 'LPPM'), controller.remove);

module.exports = router;
