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

// GET /kpi-snapshots - Get all KPI snapshots
router.get(
  '/',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.getAll,
);

// GET /kpi-snapshots/lecturer/:lecturerId - Get by lecturer
router.get(
  '/lecturer/:lecturerId',
  authorizeOwnerOrRoles('KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.getByLecturer,
);

// GET /kpi-snapshots/lecturer/:lecturerId/latest - Get latest by lecturer
router.get(
  '/lecturer/:lecturerId/latest',
  authorizeOwnerOrRoles('KAPRODI', 'DEKAN', 'LPM', 'LPPM'),
  controller.getLatestByLecturer,
);

// GET /kpi-snapshots/:id - Get single KPI snapshot
router.get(
  '/:id',
  authorize('ADMIN', 'KAPRODI', 'DEKAN', 'LPM', 'LPPM', 'DOSEN'),
  controller.getById,
);

// POST /kpi-snapshots - Create KPI snapshot
router.post('/', authorize('ADMIN', 'KAPRODI', 'LPM'), controller.create);

// PUT /kpi-snapshots/:id - Update KPI snapshot
router.put('/:id', authorize('ADMIN', 'KAPRODI', 'LPM'), controller.update);

// DELETE /kpi-snapshots/:id - Delete KPI snapshot (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
