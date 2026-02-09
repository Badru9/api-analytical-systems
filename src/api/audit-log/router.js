const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// GET /audit-logs - Get all audit logs
router.get('/', controller.getAll);

// GET /audit-logs/entity/:entityType/:entityId - Get by entity
router.get('/entity/:entityType/:entityId', controller.getByEntity);

// GET /audit-logs/user/:userId - Get by user
router.get('/user/:userId', controller.getByUser);

// GET /audit-logs/:id - Get single audit log
router.get('/:id', controller.getById);

// POST /audit-logs - Create audit log (internal use)
router.post('/', controller.create);

module.exports = router;
