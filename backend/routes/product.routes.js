const express = require('express');
const router = express.Router();
const { getProductByBarcode } = require('../controllers/product.controller');

// Get product by barcode
router.get('/barcode/:barcode', getProductByBarcode);

module.exports = router; 