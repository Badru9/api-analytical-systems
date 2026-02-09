const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /users - Get all users (ADMIN, KAPRODI, DEKAN)
router.get(
  '/',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.getAll,
);

// GET /users/:id - Get single user (ADMIN, KAPRODI, DEKAN)
router.get(
  '/:id',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.getById,
);

// POST /users - Create user (ADMIN only)
router.post('/', authorize('ADMIN'), controller.create);

// PUT /users/:id - Update user (ADMIN only)
router.put('/:id', authorize('ADMIN'), controller.update);

// DELETE /users/:id - Delete user (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

// PUT /users/:id/reset-password - Reset user password (ADMIN only)
router.put('/:id/reset-password', authorize('ADMIN'), controller.resetPassword);

module.exports = router;
