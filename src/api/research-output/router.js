const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /research-outputs - Get all research outputs
router.get('/', controller.getAll);

// GET /research-outputs/project/:projectId - Get by research project
router.get('/project/:projectId', controller.getByProject);

// GET /research-outputs/:id - Get single research output
router.get('/:id', controller.getById);

// POST /research-outputs - Create research output
router.post(
  '/',
  authorize('ADMIN', 'KAPRODI', 'LPPM', 'DOSEN'),
  controller.create,
);

// PUT /research-outputs/:id - Update research output
router.put(
  '/:id',
  authorize('ADMIN', 'KAPRODI', 'LPPM', 'DOSEN'),
  controller.update,
);

// DELETE /research-outputs/:id - Delete research output
router.delete('/:id', authorize('ADMIN', 'LPPM'), controller.remove);

module.exports = router;
