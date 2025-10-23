const { getRecommendations: getGeminiRecommendations } = require('../config/gemini');

// Get AI-powered recommendations for a product
const getRecommendations = async (req, res) => {
  try {
    const { productData, userPreferences } = req.body;

    if (!productData) {
      return res.status(400).json({ error: 'Product data is required' });
    }

    // Create a detailed prompt for Gemini AI
    const prompt = `
      Analyze the following food product and provide comprehensive health recommendations:

      Product Information:
      - Name: ${productData.name || 'Unknown Product'}
      - Brand: ${productData.brand || 'Unknown Brand'}
      - Barcode: ${productData.barcode || 'N/A'}

      Nutrition per 100g:
      - Calories: ${productData.nutrition?.calories || productData.caloriesPer100g || 0}
      - Carbohydrates: ${productData.nutrition?.carbs || productData.carbsPer100g || 0}g
      - Protein: ${productData.nutrition?.protein || productData.proteinsPer100g || 0}g
      - Fat: ${productData.nutrition?.fat || productData.fatsPer100g || 0}g
      - Sugar: ${productData.nutrition?.sugar || productData.sugarsPer100g || 0}g
      - Fiber: ${productData.nutrition?.fiber || 2}g (estimated if not provided)
      - Sodium: ${productData.nutrition?.sodium || 200}mg (estimated if not provided)

      ${productData.ingredients ? `Ingredients: ${productData.ingredients.join(', ')}` : ''}
      ${productData.categories ? `Categories: ${productData.categories.join(', ')}` : ''}

      User Preferences:
      ${userPreferences ? JSON.stringify(userPreferences) : 'No specific preferences provided'}

      Please provide a detailed analysis in the following JSON format:
      {
        "healthScore": [number between 1-100, where 100 is healthiest],
        "healthInsights": {
          "positive": [
            "List 2-4 positive nutritional aspects of this product"
          ],
          "concerns": [
            "List 2-4 health concerns or areas for improvement"
          ],
          "recommendations": [
            "List 3-4 specific recommendations for healthy consumption"
          ]
        },
        "alternatives": [
          {
            "name": "Specific product name",
            "brand": "Brand name",
            "nutrition": {
              "calories": [estimated calories per 100g],
              "fat": [estimated fat in grams],
              "carbs": [estimated carbs in grams],
              "protein": [estimated protein in grams],
              "sugar": [estimated sugar in grams],
              "fiber": [estimated fiber in grams],
              "sodium": [estimated sodium in mg]
            },
            "healthScore": [number between 1-100],
            "whyBetter": [
              "2-3 specific reasons why this alternative is healthier"
            ],
            "availableAt": [
              "List of 2-3 common stores where this can be found"
            ]
          }
        ]
      }

      Guidelines:
      1. Health score should consider calories, sugar content, protein, fiber, sodium, and processing level
      2. Provide 3 realistic alternative products that are commonly available
      3. Make recommendations specific to the product type (e.g., if it's a snack, suggest healthier snacks)
      4. Consider portion sizes and realistic consumption patterns
      5. Focus on practical, actionable advice
      6. Ensure all nutrition values are realistic and well-researched
      7. Return ONLY the JSON object, no additional text or formatting

      Generate the response now:
    `;

    console.log('🤖 Generating AI recommendations with Gemini...');
    
    try {
      const aiResponse = await getGeminiRecommendations(prompt);
      
      // Parse the AI response as JSON
      let recommendationData;
      try {
        // Clean the response to extract JSON
        const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        recommendationData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('Raw AI response:', aiResponse);
        
        // Fallback to mock data if parsing fails
        recommendationData = generateFallbackRecommendation(productData);
      }

      console.log('✅ AI recommendations generated successfully');
      res.json({
        success: true,
        data: recommendationData,
        source: 'gemini-ai'
      });

    } catch (aiError) {
      console.error('Gemini AI error:', aiError);
      
      // Fallback to mock data if AI fails
      const fallbackData = generateFallbackRecommendation(productData);
      
      res.json({
        success: true,
        data: fallbackData,
        source: 'fallback',
        warning: 'AI service unavailable, using fallback recommendations'
      });
    }

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      details: error.message 
    });
  }
};

// Fallback recommendation generator
const generateFallbackRecommendation = (productData) => {
  const nutrition = productData.nutrition || productData;
  const calories = nutrition.calories || nutrition.caloriesPer100g || 0;
  const protein = nutrition.protein || nutrition.proteinsPer100g || 0;
  const carbs = nutrition.carbs || nutrition.carbsPer100g || 0;
  const fat = nutrition.fat || nutrition.fatsPer100g || 0;
  const sugar = nutrition.sugar || nutrition.sugarsPer100g || 0;

  // Calculate health score
  let healthScore = 70; // Base score
  if (sugar > 15) healthScore -= 15;
  if (sugar < 5) healthScore += 10;
  if (protein > 10) healthScore += 10;
  if (fat > 20) healthScore -= 10;
  if (calories < 100) healthScore += 10;
  if (calories > 400) healthScore -= 15;
  healthScore = Math.max(20, Math.min(95, healthScore));

  // Generate insights
  const positive = [];
  const concerns = [];
  
  if (protein > 10) positive.push(`Good protein content (${protein}g per 100g)`);
  if (calories < 200) positive.push('Relatively low in calories');
  if (fat < 5) positive.push('Low fat content');
  if (positive.length === 0) positive.push('Provides essential nutrients');

  if (sugar > 15) concerns.push(`High sugar content (${sugar}g per 100g)`);
  if (calories > 400) concerns.push('High calorie density');
  if (fat > 20) concerns.push(`High fat content (${fat}g per 100g)`);
  if (concerns.length === 0) concerns.push('Monitor portion sizes for optimal health');

  const recommendations = [
    'Consider portion control when consuming this product',
    'Balance with fiber-rich vegetables and fruits',
    'Stay hydrated and maintain regular physical activity',
    'Check nutrition labels for similar products to compare'
  ];

  // Generate alternatives
  const alternatives = [
    {
      name: "Organic Whole Grain Alternative",
      brand: "Nature's Choice",
      nutrition: {
        calories: Math.max(100, calories - 50),
        fat: Math.max(1, fat - 5),
        carbs: Math.max(10, carbs - 10),
        protein: protein + 3,
        sugar: Math.max(1, sugar - 8),
        fiber: 6,
        sodium: 150
      },
      healthScore: Math.min(95, healthScore + 15),
      whyBetter: [
        "Lower sugar content",
        "Higher fiber and protein",
        "Made with organic ingredients"
      ],
      availableAt: ["Whole Foods", "Target", "Local health stores"]
    },
    {
      name: "Plant-Based Protein Option",
      brand: "GreenLife",
      nutrition: {
        calories: Math.max(120, calories - 30),
        fat: Math.max(2, fat - 3),
        carbs: Math.max(15, carbs - 5),
        protein: protein + 5,
        sugar: Math.max(2, sugar - 10),
        fiber: 8,
        sodium: 180
      },
      healthScore: Math.min(95, healthScore + 18),
      whyBetter: [
        "Plant-based protein source",
        "Higher fiber content",
        "No artificial additives"
      ],
      availableAt: ["Trader Joe's", "Amazon", "Local grocery stores"]
    },
    {
      name: "Low-Sodium Heart-Healthy Version",
      brand: "CardioWise",
      nutrition: {
        calories: Math.max(80, calories - 20),
        fat: Math.max(1, fat - 4),
        carbs: carbs,
        protein: protein + 2,
        sugar: Math.max(1, sugar - 5),
        fiber: 4,
        sodium: 80
      },
      healthScore: Math.min(95, healthScore + 12),
      whyBetter: [
        "Significantly less sodium",
        "Heart-healthy formulation",
        "Added beneficial nutrients"
      ],
      availableAt: ["CVS", "Walgreens", "Health food stores"]
    }
  ];

  return {
    healthScore,
    healthInsights: {
      positive: positive.slice(0, 3),
      concerns: concerns.slice(0, 3),
      recommendations: recommendations.slice(0, 3)
    },
    alternatives
  };
};

module.exports = {
  getRecommendations
}; 