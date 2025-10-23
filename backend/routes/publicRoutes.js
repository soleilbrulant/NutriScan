const express = require('express');
const router = express.Router();
const foodItemController = require('../controllers/foodItemController');

// Public barcode lookup - no authentication required
router.get('/barcode/:barcode', foodItemController.getFoodItemByBarcode);

module.exports = router; 