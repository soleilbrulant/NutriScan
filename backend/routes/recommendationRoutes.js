const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendation.controller');
const authenticateToken = require('../middlewares/authMiddleware');

// Get AI recommendations for a product
router.post('/generate', authenticateToken, getRecommendations);

module.exports = router; 