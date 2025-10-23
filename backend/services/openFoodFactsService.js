const axios = require('axios');

class OpenFoodFactsService {
  constructor() {
    this.baseURL = 'https://world.openfoodfacts.org/api/v0/product';
    this.userAgent = 'NutriScan/1.0.0';
  }

  /**
   * Fetch product data from OpenFoodFacts API by barcode
   * @param {string} barcode - Product barcode
   * @returns {Promise<Object|null>} - Formatted product data or null if not found
   */
  async getProductByBarcode(barcode) {
    try {
      const response = await axios.get(`${this.baseURL}/${barcode}.json`, {
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000 // 10 second timeout
      });

      const data = response.data;

      // Check if product was found
      if (data.status === 0 || !data.product) {
        return null;
      }

      const product = data.product;

      // Extract and format nutritional data
      const nutritionData = this.extractNutritionData(product);
      
      if (!nutritionData) {
        return null; // No valid nutrition data found
      }

      return {
        barcode: barcode,
        name: this.getProductName(product),
        brand: product.brands || null,
        servingSize: this.getServingSize(product),
        caloriesPer100g: nutritionData.energy || 0,
        carbsPer100g: nutritionData.carbohydrates || 0,
        proteinsPer100g: nutritionData.proteins || 0,
        fatsPer100g: nutritionData.fat || 0,
        sugarsPer100g: nutritionData.sugars || 0,
        fiberPer100g: nutritionData.fiber || 0,
        sodiumPer100g: nutritionData.sodium || 0,
        imageUrl: product.image_url || null,
        ingredients: product.ingredients_text || '',
        categories: product.categories || '',
        dataSource: 'OpenFoodFacts'
      };

    } catch (error) {
      console.error('OpenFoodFacts API error:', error.message);
      throw new Error(`Failed to fetch product data: ${error.message}`);
    }
  }

  /**
   * Extract nutrition data from product, handling different units
   * @param {Object} product - Raw product data from API
   * @returns {Object|null} - Normalized nutrition data per 100g
   */
  extractNutritionData(product) {
    const nutriments = product.nutriments;
    
    if (!nutriments) {
      return null;
    }

    // Helper function to get value per 100g, handling different suffixes
    const getNutrientPer100g = (nutrientName) => {
      // Try different possible keys for per 100g values (based on OpenFoodFacts API docs)
      const possibleKeys = [
        `${nutrientName}_100g`,
        `${nutrientName}-100g`,
        `${nutrientName}_per_100g`,
        `${nutrientName}-per-100g`
      ];
      
      for (const key of possibleKeys) {
        if (nutriments[key] !== undefined && nutriments[key] !== null && nutriments[key] !== '') {
          const value = parseFloat(nutriments[key]);
          return isNaN(value) ? 0 : value;
        }
      }
      
      // Fallback to base nutrient if per 100g not available
      if (nutriments[nutrientName] !== undefined && nutriments[nutrientName] !== null && nutriments[nutrientName] !== '') {
        const value = parseFloat(nutriments[nutrientName]);
        return isNaN(value) ? 0 : value;
      }
      
      return 0;
    };

    // Convert energy from kJ to kcal if needed (based on OpenFoodFacts API docs)
    let energy = getNutrientPer100g('energy-kcal') || getNutrientPer100g('energy_kcal');
    if (!energy) {
      const energyKj = getNutrientPer100g('energy-kj') || getNutrientPer100g('energy_kj') || getNutrientPer100g('energy');
      energy = energyKj ? Math.round(energyKj / 4.184) : 0; // Convert kJ to kcal
    }

    return {
      energy: energy,
      carbohydrates: getNutrientPer100g('carbohydrates'),
      proteins: getNutrientPer100g('proteins'),
      fat: getNutrientPer100g('fat'),
      sugars: getNutrientPer100g('sugars'),
      fiber: getNutrientPer100g('fiber'),
      sodium: getNutrientPer100g('sodium')
    };
  }

  /**
   * Get product name with fallbacks
   * @param {Object} product - Product data
   * @returns {string} - Product name
   */
  getProductName(product) {
    return product.product_name || 
           product.product_name_en || 
           product.generic_name || 
           product.abbreviated_product_name || 
           'Unknown Product';
  }

  /**
   * Get serving size with fallbacks
   * @param {Object} product - Product data
   * @returns {number} - Serving size in grams
   */
  getServingSize(product) {
    if (product.serving_size) {
      // Try to extract number from serving size string
      const match = product.serving_size.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    
    // Default serving size
    return 100;
  }

  /**
   * Search products by name (optional feature)
   * @param {string} searchTerm - Search term
   * @param {number} page - Page number (default: 1)
   * @param {number} pageSize - Results per page (default: 20)
   * @returns {Promise<Object>} - Search results
   */
  async searchProducts(searchTerm, page = 1, pageSize = 20) {
    try {
      const response = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', {
        params: {
          search_terms: searchTerm,
          search_simple: 1,
          action: 'process',
          json: 1,
          page: page,
          page_size: pageSize
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      const data = response.data;
      
      return {
        count: data.count || 0,
        page: data.page || 1,
        pageSize: data.page_size || pageSize,
        products: (data.products || []).map(product => ({
          barcode: product.code,
          name: this.getProductName(product),
          brand: product.brands || 'Unknown',
          imageUrl: product.image_url || null
        }))
      };

    } catch (error) {
      console.error('OpenFoodFacts search error:', error.message);
      throw new Error(`Search failed: ${error.message}`);
    }
  }
}

module.exports = new OpenFoodFactsService(); 