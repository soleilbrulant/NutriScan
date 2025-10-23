const axios = require('axios');

// Get product by barcode
const getProductByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;
        
        if (!barcode) {
            return res.status(400).json({ error: 'Barcode is required' });
        }

        const response = await axios.get(`https://world.openfoodfacts.net/api/v2/product/${barcode}`);
        
        if (response.data.status === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ 
            error: 'Failed to fetch product',
            details: error.message 
        });
    }
};

module.exports = {
    getProductByBarcode
}; 