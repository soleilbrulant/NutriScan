const express = require('express');
const { getGeminiResponse, healthCheck } = require('../controllers/geminiController');
const { chat, nutritionQuestion } = require('../controllers/chatbotController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/gemini/health
 * @desc    Check if Gemini AI service is operational
 * @access  Public
 */
router.get('/health', healthCheck);

/**
 * @route   POST /api/gemini/prompt
 * @desc    Send prompt to Gemini AI and get response
 * @access  Private (requires authentication)
 */
router.post('/prompt', authMiddleware, getGeminiResponse);

/**
 * @route   POST /api/gemini/chat
 * @desc    Chatbot conversation endpoint with context awareness
 * @access  Private (requires authentication)
 */
router.post('/chat', authMiddleware, chat);

/**
 * @route   POST /api/gemini/nutrition-question
 * @desc    Specialized endpoint for nutrition-specific questions
 * @access  Private (requires authentication)
 */
router.post('/nutrition-question', authMiddleware, nutritionQuestion);

module.exports = router; 