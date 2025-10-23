const { FoodItem } = require('../models/relations');
const { Op } = require('sequelize');
const openFoodFactsService = require('../services/openFoodFactsService');

const foodItemController = {
  // GET /api/food/barcode/:barcode - Get food item by barcode (with OpenFoodFacts fallback)
  getFoodItemByBarcode: async (req, res) => {
    try {
      const { barcode } = req.params;
      const { autoFetch = true } = req.query;

      // First, check if food item exists in our database
      let foodItem = await FoodItem.findOne({ 
        where: { barcode } 
      });

      // Check if existing data is obviously incomplete and needs refresh
      const isIncompleteData = foodItem && (
        foodItem.caloriesPer100g < 10 || // Suspiciously low calories
        !foodItem.carbsPer100g || 
        !foodItem.proteinsPer100g || 
        !foodItem.fatsPer100g ||
        foodItem.name.includes('Product ') // Generic placeholder name
      );

      if (foodItem && !isIncompleteData) {
        return res.status(200).json({ 
          foodItem,
          source: 'database'
        });
      }

      // If not found in database OR has incomplete data, and autoFetch is enabled, try OpenFoodFacts
      if (autoFetch && (!foodItem || isIncompleteData)) {
        try {
          const openFoodFactsData = await openFoodFactsService.getProductByBarcode(barcode);
          
          if (openFoodFactsData) {
            if (foodItem && isIncompleteData) {
              // Update existing incomplete record
              console.log(`Updating incomplete record for barcode ${barcode} with OpenFoodFacts data`);
              await foodItem.update({
                name: openFoodFactsData.name,
                brand: openFoodFactsData.brand,
                servingSize: openFoodFactsData.servingSize,
                caloriesPer100g: openFoodFactsData.caloriesPer100g,
                carbsPer100g: openFoodFactsData.carbsPer100g,
                proteinsPer100g: openFoodFactsData.proteinsPer100g,
                fatsPer100g: openFoodFactsData.fatsPer100g,
                sugarsPer100g: openFoodFactsData.sugarsPer100g,
                fiberPer100g: openFoodFactsData.fiberPer100g,
                sodiumPer100g: openFoodFactsData.sodiumPer100g,
                imageUrl: openFoodFactsData.imageUrl,
                source: 'openfoodfacts',
                lastUpdated: new Date()
              });

              return res.status(200).json({
                message: 'Food item updated with OpenFoodFacts data',
                foodItem,
                source: 'openfoodfacts',
                additionalData: {
                  brand: openFoodFactsData.brand,
                  imageUrl: openFoodFactsData.imageUrl,
                  ingredients: openFoodFactsData.ingredients,
                  categories: openFoodFactsData.categories
                }
              });
            } else {
              // Create new food item in database
              foodItem = await FoodItem.create({
                barcode: openFoodFactsData.barcode,
                name: openFoodFactsData.name,
                brand: openFoodFactsData.brand,
                servingSize: openFoodFactsData.servingSize,
                caloriesPer100g: openFoodFactsData.caloriesPer100g,
                carbsPer100g: openFoodFactsData.carbsPer100g,
                proteinsPer100g: openFoodFactsData.proteinsPer100g,
                fatsPer100g: openFoodFactsData.fatsPer100g,
                sugarsPer100g: openFoodFactsData.sugarsPer100g,
                fiberPer100g: openFoodFactsData.fiberPer100g,
                sodiumPer100g: openFoodFactsData.sodiumPer100g,
                imageUrl: openFoodFactsData.imageUrl,
                source: 'openfoodfacts',
                lastUpdated: new Date()
              });

              return res.status(201).json({
                message: 'Food item fetched from OpenFoodFacts and saved to database',
                foodItem,
                source: 'openfoodfacts',
                additionalData: {
                  brand: openFoodFactsData.brand,
                  imageUrl: openFoodFactsData.imageUrl,
                  ingredients: openFoodFactsData.ingredients,
                  categories: openFoodFactsData.categories
                }
              });
            }
          }
        } catch (openFoodFactsError) {
          console.error('OpenFoodFacts error:', openFoodFactsError.message);
          // Continue to return existing data or 404 if OpenFoodFacts also fails
        }
      }

      // If we have an existing item (even if incomplete) and OpenFoodFacts failed, return it
      if (foodItem) {
        return res.status(200).json({ 
          foodItem,
          source: 'database',
          warning: isIncompleteData ? 'Data may be incomplete - OpenFoodFacts lookup failed' : undefined
        });
      }

      return res.status(404).json({ 
        error: 'Food item not found',
        message: autoFetch ? 
          'Food item not found in database or OpenFoodFacts' : 
          'Food item not found in database. Set autoFetch=true to search OpenFoodFacts'
      });

    } catch (error) {
      console.error('Get food item error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch food item' 
      });
    }
  },

  // POST /api/food - Create food item (manual or from OpenFoodFacts)
  createFoodItem: async (req, res) => {
    try {
      const { 
        barcode, 
        name, 
        servingSize, 
        caloriesPer100g, 
        carbsPer100g, 
        proteinsPer100g, 
        fatsPer100g, 
        sugarsPer100g,
        fetchFromOpenFoodFacts = false
      } = req.body;

      // Check if food item already exists
      const existingFood = await FoodItem.findOne({ 
        where: { barcode } 
      });

      if (existingFood) {
        return res.status(400).json({ 
          error: 'Food item with this barcode already exists',
          existingItem: existingFood
        });
      }

      let foodItemData = {
        barcode,
        name,
        servingSize,
        caloriesPer100g,
        carbsPer100g,
        proteinsPer100g,
        fatsPer100g,
        sugarsPer100g
      };

      let additionalData = null;

      // If requested, fetch data from OpenFoodFacts first
      if (fetchFromOpenFoodFacts) {
        try {
          const openFoodFactsData = await openFoodFactsService.getProductByBarcode(barcode);
          
          if (openFoodFactsData) {
            // Use OpenFoodFacts data as base, allow manual overrides
            foodItemData = {
              barcode,
              name: name || openFoodFactsData.name,
              servingSize: servingSize || openFoodFactsData.servingSize,
              caloriesPer100g: caloriesPer100g !== undefined ? caloriesPer100g : openFoodFactsData.caloriesPer100g,
              carbsPer100g: carbsPer100g !== undefined ? carbsPer100g : openFoodFactsData.carbsPer100g,
              proteinsPer100g: proteinsPer100g !== undefined ? proteinsPer100g : openFoodFactsData.proteinsPer100g,
              fatsPer100g: fatsPer100g !== undefined ? fatsPer100g : openFoodFactsData.fatsPer100g,
              sugarsPer100g: sugarsPer100g !== undefined ? sugarsPer100g : openFoodFactsData.sugarsPer100g
            };

            additionalData = {
              brand: openFoodFactsData.brand,
              imageUrl: openFoodFactsData.imageUrl,
              ingredients: openFoodFactsData.ingredients,
              categories: openFoodFactsData.categories
            };
          }
        } catch (openFoodFactsError) {
          console.error('OpenFoodFacts error during creation:', openFoodFactsError.message);
          // Continue with manual data if OpenFoodFacts fails
        }
      }

      // Validate required fields
      if (!foodItemData.name || foodItemData.caloriesPer100g === undefined) {
        return res.status(400).json({
          error: 'Name and caloriesPer100g are required fields'
        });
      }

      // Create new food item
      const foodItem = await FoodItem.create(foodItemData);

      const response = {
        message: 'Food item created successfully',
        foodItem
      };

      if (additionalData) {
        response.additionalData = additionalData;
        response.source = 'openfoodfacts_enhanced';
      }

      res.status(201).json(response);

    } catch (error) {
      console.error('Create food item error:', error);
      res.status(500).json({ 
        error: 'Failed to create food item' 
      });
    }
  },

  // GET /api/food - Get all food items with optional search
  getAllFoodItems: async (req, res) => {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};
      
      if (search) {
        whereClause = {
          name: {
            [Op.iLike]: `%${search}%`
          }
        };
      }

      const { count, rows: foodItems } = await FoodItem.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        foodItems,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get all food items error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch food items' 
      });
    }
  },

  // GET /api/food/search-external - Search OpenFoodFacts directly
  searchExternalFoodItems: async (req, res) => {
    try {
      const { q, page = 1, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({
          error: 'Search query (q) is required'
        });
      }

      const searchResults = await openFoodFactsService.searchProducts(q, page, limit);

      res.status(200).json({
        message: 'External search results from OpenFoodFacts',
        results: searchResults,
        source: 'openfoodfacts'
      });

    } catch (error) {
      console.error('External search error:', error);
      res.status(500).json({ 
        error: 'Failed to search external food database' 
      });
    }
  },

  // PUT /api/food/:barcode - Update food item
  updateFoodItem: async (req, res) => {
    try {
      const { barcode } = req.params;
      const { 
        name, 
        servingSize, 
        caloriesPer100g, 
        carbsPer100g, 
        proteinsPer100g, 
        fatsPer100g, 
        sugarsPer100g 
      } = req.body;

      const foodItem = await FoodItem.findOne({ 
        where: { barcode } 
      });

      if (!foodItem) {
        return res.status(404).json({ 
          error: 'Food item not found' 
        });
      }

      // Update food item
      await foodItem.update({
        name: name !== undefined ? name : foodItem.name,
        servingSize: servingSize !== undefined ? servingSize : foodItem.servingSize,
        caloriesPer100g: caloriesPer100g !== undefined ? caloriesPer100g : foodItem.caloriesPer100g,
        carbsPer100g: carbsPer100g !== undefined ? carbsPer100g : foodItem.carbsPer100g,
        proteinsPer100g: proteinsPer100g !== undefined ? proteinsPer100g : foodItem.proteinsPer100g,
        fatsPer100g: fatsPer100g !== undefined ? fatsPer100g : foodItem.fatsPer100g,
        sugarsPer100g: sugarsPer100g !== undefined ? sugarsPer100g : foodItem.sugarsPer100g
      });

      res.status(200).json({
        message: 'Food item updated successfully',
        foodItem
      });

    } catch (error) {
      console.error('Update food item error:', error);
      res.status(500).json({ 
        error: 'Failed to update food item' 
      });
    }
  },

  // DELETE /api/food/:barcode - Delete food item (admin only - to be implemented)
  deleteFoodItem: async (req, res) => {
    try {
      const { barcode } = req.params;

      const foodItem = await FoodItem.findOne({ 
        where: { barcode } 
      });

      if (!foodItem) {
        return res.status(404).json({ 
          error: 'Food item not found' 
        });
      }

      await foodItem.destroy();

      res.status(200).json({
        message: 'Food item deleted successfully'
      });

    } catch (error) {
      console.error('Delete food item error:', error);
      res.status(500).json({ 
        error: 'Failed to delete food item' 
      });
    }
  }
};

module.exports = foodItemController; 