const express = require('express');
const router = express.Router();
const dailyGoalController = require('../controllers/dailyGoalController');
const authMiddleware = require('../middlewares/authMiddleware');

// All daily goal routes require authentication
router.use(authMiddleware);

// POST /api/goals - Create daily goals
router.post('/', dailyGoalController.createDailyGoal);

// GET /api/goals/calculate - Preview calculated goals without saving
router.get('/calculate', dailyGoalController.previewCalculatedGoals);

// GET /api/goals - Get user's daily goals
router.get('/', dailyGoalController.getDailyGoal);

// PUT /api/goals - Update user's daily goals
router.put('/', dailyGoalController.updateDailyGoal);

// DELETE /api/goals - Delete user's daily goals
router.delete('/', dailyGoalController.deleteDailyGoal);

module.exports = router; 