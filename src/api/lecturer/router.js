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

// GET /lecturers - Get all lecturers (all authenticated users)
router.get('/', controller.getAll);

// GET /lecturers/:id - Get single lecturer (all authenticated users)
router.get('/:id', controller.getById);

// GET /lecturers/:id/dashboard - Get lecturer dashboard (owner or supervisors)
router.get(
  '/:id/dashboard',
  authorizeOwnerOrRoles('KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.getDashboard,
);

// POST /lecturers - Create lecturer (ADMIN, KAPRODI)
router.post('/', authorize('ADMIN', 'KAPRODI'), controller.create);

// PUT /lecturers/:id - Update lecturer (ADMIN, KAPRODI)
router.put('/:id', authorize('ADMIN', 'KAPRODI'), controller.update);

// DELETE /lecturers/:id - Delete lecturer (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
