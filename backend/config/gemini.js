const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with API key from environment variables
const initializeGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found in environment variables');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini AI initialized successfully');
    return genAI;
  } catch (error) {
    console.error('Error initializing Gemini AI:', error);
    return null;
  }
};

// Get recommendations using Gemini
const getRecommendations = async (prompt) => {
  const genAI = initializeGemini();
  
  if (!genAI) {
    throw new Error('Gemini AI not initialized or not working. Check your API key.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw new Error(`Failed to get recommendations: ${error.message}`);
  }
};

module.exports = {
  initializeGemini,
  getRecommendations
}; 