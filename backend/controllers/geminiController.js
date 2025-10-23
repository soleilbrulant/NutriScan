const { getRecommendations } = require('../config/gemini');

/**
 * Get response from Gemini AI based on user prompt
 */
const getGeminiResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    // Get response from Gemini
    const response = await getRecommendations(prompt);

    res.status(200).json({
      success: true,
      data: {
        prompt: prompt,
        response: response
      },
      message: 'Response generated successfully'
    });

  } catch (error) {
    console.error('Error in getGeminiResponse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get response from Gemini',
      error: error.message
    });
  }
};

/**
 * Health check for Gemini service
 */
const healthCheck = async (req, res) => {
  try {
    // Test if Gemini service is available with a simple prompt
    const testResponse = await getRecommendations('Say hello');
    
    res.status(200).json({
      success: true,
      message: 'Gemini AI service is operational',
      testResponse: testResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Gemini AI service is not available',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getGeminiResponse,
  healthCheck
}; 