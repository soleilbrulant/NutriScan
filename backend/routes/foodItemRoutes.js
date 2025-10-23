const express = require('express');
const router = express.Router();
const foodItemController = require('../controllers/foodItemController');
const conditionalAuthMiddleware = require('../middlewares/conditionalAuthMiddleware');

// Apply conditional authentication middleware to all routes
// This will skip auth for barcode lookup and search-external routes
router.use(conditionalAuthMiddleware);

// GET /api/food/barcode/:barcode - Get food item by barcode (PUBLIC - no auth required)
router.get('/barcode/:barcode', foodItemController.getFoodItemByBarcode);

// GET /api/food/search-external - Search OpenFoodFacts directly (PUBLIC - no auth required)
router.get('/search-external', foodItemController.searchExternalFoodItems);

// POST /api/food - Create food item (PROTECTED - auth required)
router.post('/', foodItemController.createFoodItem);

// GET /api/food - Get all food items with optional search and pagination (PROTECTED - auth required)
router.get('/', foodItemController.getAllFoodItems);

// PUT /api/food/:barcode - Update food item (PROTECTED - auth required)
router.put('/:barcode', foodItemController.updateFoodItem);

// DELETE /api/food/:barcode - Delete food item (PROTECTED - auth required)
router.delete('/:barcode', foodItemController.deleteFoodItem);

module.exports = router; 