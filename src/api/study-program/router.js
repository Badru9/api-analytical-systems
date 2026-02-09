const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// GET /study-programs - Get all study programs (all authenticated users)
router.get('/', controller.getAll);

// GET /study-programs/:id - Get single study program (all authenticated users)
router.get('/:id', controller.getById);

// POST /study-programs - Create study program (ADMIN, DEKAN, KAPRODI)
router.post('/', authorize('ADMIN', 'DEKAN', 'KAPRODI'), controller.create);

// PUT /study-programs/:id - Update study program (ADMIN, DEKAN, KAPRODI)
router.put('/:id', authorize('ADMIN', 'DEKAN', 'KAPRODI'), controller.update);

// DELETE /study-programs/:id - Delete study program (ADMIN only)
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
