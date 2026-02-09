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

// GET /reviews - Get all reviews
router.get(
  '/',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.getAll,
);

// GET /reviews/my-reviews - Get reviews by current reviewer
router.get(
  '/my-reviews',
  authorize('KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.getByReviewer,
);

// GET /reviews/lecturer/:lecturerId - Get reviews by lecturer
router.get(
  '/lecturer/:lecturerId',
  authorizeOwnerOrRoles('KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.getByLecturer,
);

// GET /reviews/:id - Get single review
router.get(
  '/:id',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM', 'DOSEN'),
  controller.getById,
);

// POST /reviews - Create review
router.post(
  '/',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.create,
);

// PUT /reviews/:id - Update review
router.put(
  '/:id',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.update,
);

// PUT /reviews/:id/complete - Complete review with decision
router.put(
  '/:id/complete',
  authorize('KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.complete,
);

// DELETE /reviews/:id - Delete review (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
