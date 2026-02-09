const express = require('express');
const router = express.Router();
const {
  login,
  changePassword,
  getProfile,
  register,
  updateProfile,
} = require('./controller');
const { authenticate } = require('../../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
