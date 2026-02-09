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

// GET /notes - Get all notes
router.get(
  '/',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.getAll,
);

// GET /notes/lecturer/:lecturerId - Get notes by lecturer
router.get(
  '/lecturer/:lecturerId',
  authorizeOwnerOrRoles('KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.getByLecturer,
);

// GET /notes/:id - Get single note
router.get(
  '/:id',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM', 'DOSEN'),
  controller.getById,
);

// POST /notes - Create note
router.post(
  '/',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.create,
);

// PUT /notes/:id - Update note
router.put(
  '/:id',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.update,
);

// DELETE /notes/:id - Delete note
router.delete(
  '/:id',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.remove,
);

module.exports = router;
