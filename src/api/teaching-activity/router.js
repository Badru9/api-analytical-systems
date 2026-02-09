const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /teaching-activities - Get all teaching activities
router.get('/', controller.getAll);

// GET /teaching-activities/:id - Get single teaching activity
router.get('/:id', controller.getById);

// GET /teaching-activities/offering/:courseOfferingId - Get by course offering
router.get('/offering/:courseOfferingId', controller.getByCourseOffering);

// POST /teaching-activities/offering/:courseOfferingId - Create or update teaching activity
router.post(
  '/offering/:courseOfferingId',
  authorize('ADMIN', 'KAPRODI', 'DOSEN'),
  controller.upsert,
);

// PUT /teaching-activities/:id - Update teaching activity
router.put('/:id', authorize('ADMIN', 'KAPRODI', 'DOSEN'), controller.update);

// DELETE /teaching-activities/:id - Delete teaching activity (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
