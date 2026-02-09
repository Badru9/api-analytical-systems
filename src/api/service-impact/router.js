const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /service-impacts/:id - Get service impact by ID
router.get('/:id', controller.getById);

// GET /service-impacts/program/:serviceProgramId - Get by service program
router.get('/program/:serviceProgramId', controller.getByServiceProgram);

// POST /service-impacts/program/:serviceProgramId - Create or update service impact
router.post(
  '/program/:serviceProgramId',
  authorize('ADMIN', 'KAPRODI', 'LPPM', 'DOSEN'),
  controller.upsert,
);

// PUT /service-impacts/:id - Update service impact
router.put(
  '/:id',
  authorize('ADMIN', 'KAPRODI', 'LPPM', 'DOSEN'),
  controller.update,
);

// DELETE /service-impacts/:id - Delete service impact
router.delete('/:id', authorize('ADMIN', 'LPPM'), controller.remove);

module.exports = router;
