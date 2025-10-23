const express = require('express');
const router = express.Router();
const foodItemController = require('../controllers/foodItemController');

// Public barcode lookup - absolutely no authentication required
router.get('/:barcode', foodItemController.getFoodItemByBarcode);

module.exports = router; 