const express = require('express');
const router = express.Router();
const consumptionLogController = require('../controllers/consumptionLogController');
const authMiddleware = require('../middlewares/authMiddleware');

// All consumption log routes require authentication
router.use(authMiddleware);

// POST /api/logs/scan - Scan barcode and log consumption in one step  
router.post('/scan', consumptionLogController.scanAndLogFood);

// POST /api/logs - Create consumption log
router.post('/', consumptionLogController.createConsumptionLog);

// GET /api/logs - Get user's consumption logs with filtering
router.get('/', consumptionLogController.getAllConsumptionLogs);

// GET /api/logs/daily-summary/:date - Get daily nutrition summary
router.get('/daily-summary/:date', consumptionLogController.getDailySummary);

// GET /api/logs/:id - Get consumption log by ID
router.get('/:id', consumptionLogController.getConsumptionLogById);

// PUT /api/logs/:id - Update consumption log
router.put('/:id', consumptionLogController.updateConsumptionLog);

// DELETE /api/logs/:id - Delete consumption log
router.delete('/:id', consumptionLogController.deleteConsumptionLog);

module.exports = router; 