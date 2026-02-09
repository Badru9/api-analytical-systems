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

// GET /evidences - Get all evidences
router.get('/', controller.getAll);

// GET /evidences/lecturer/:lecturerId - Get by lecturer
router.get(
  '/lecturer/:lecturerId',
  authorizeOwnerOrRoles('KAPRODI', 'DEKAN', 'LPPM', 'LPM'),
  controller.getByLecturer,
);

// GET /evidences/:id - Get single evidence
router.get('/:id', controller.getById);

// POST /evidences - Create evidence
router.post('/', authorize('ADMIN', 'KAPRODI', 'DOSEN'), controller.create);

// PUT /evidences/:id - Update evidence
router.put('/:id', authorize('ADMIN', 'KAPRODI', 'DOSEN'), controller.update);

// PUT /evidences/:id/status - Update evidence verification status
router.put(
  '/:id/status',
  authorize('ADMIN', 'KAPRODI', 'LPM'),
  controller.updateStatus,
);

// DELETE /evidences/:id - Delete evidence
router.delete('/:id', authorize('ADMIN', 'KAPRODI'), controller.remove);

// POST /evidences/:id/links - Add evidence link
router.post(
  '/:id/links',
  authorize('ADMIN', 'KAPRODI', 'DOSEN'),
  controller.addLink,
);

// DELETE /evidences/:id/links/:linkId - Remove evidence link
router.delete(
  '/:id/links/:linkId',
  authorize('ADMIN', 'KAPRODI', 'DOSEN'),
  controller.removeLink,
);

module.exports = router;
