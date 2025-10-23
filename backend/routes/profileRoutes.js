const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middlewares/authMiddleware');

// All profile routes require authentication
router.use(authMiddleware);

// POST /api/profile - Create user profile
router.post('/', profileController.createProfile);

// GET /api/profile - Get user's profile
router.get('/', profileController.getProfile);

// PUT /api/profile - Update user's profile
router.put('/', profileController.updateProfile);

// DELETE /api/profile - Delete user's profile
router.delete('/', profileController.deleteProfile);

module.exports = router; 