const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// POST /api/auth/login - Login with Firebase token
router.post('/login', authController.login);

// GET /api/auth/me - Get current user (protected route)
router.get('/me', authMiddleware, authController.getMe);

module.exports = router; 