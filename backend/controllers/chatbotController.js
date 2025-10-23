const { getRecommendations } = require('../config/gemini');
const { User, Profile, DailyGoal, ConsumptionLog, FoodItem } = require('../models/relations');
const { Op } = require('sequelize');

/**
 * Enhanced Gemini AI controller specifically for chatbot conversations
 */
const chatbotController = {
  
  /**
   * POST /api/gemini/chat
   * Handle conversational messages with context-aware responses
   */
  chat: async (req, res) => {
    try {
      const { message, context = 'general', conversationHistory = [] } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      // Fetch comprehensive user data for personalization
      const userData = await fetchUserPersonalizationData(req.user.uid);

      // Create context-aware prompt based on the conversation type
      const systemPrompt = getSystemPrompt(context);
      const conversationContext = buildConversationContext(conversationHistory);
      const userPersonalizationContext = buildUserPersonalizationContext(userData);
      
      const fullPrompt = `${systemPrompt}

${userPersonalizationContext}

${conversationContext}

User: ${message}

AI Assistant: `;

      console.log('🤖 Processing chatbot message:', {
        context,
        messageLength: message.length,
        hasHistory: conversationHistory.length > 0,
        userDataFetched: !userData.error,
        hasProfile: !!userData.profile,
        hasGoals: !!userData.dailyGoals
      });

      // Additional debugging for profile/goals issues
      console.log('🔍 User data debug:', {
        userError: userData.error,
        userName: userData.user?.name,
        profileExists: !!userData.profile,
        profileData: userData.profile ? {
          age: userData.profile.age,
          goalType: userData.profile.goalType
        } : 'NO PROFILE',
        dailyGoalsExists: !!userData.dailyGoals,
        dailyGoalsData: userData.dailyGoals ? {
          calories: userData.dailyGoals.calories
        } : 'NO DAILY GOALS'
      });

      // Debug: Log user data structure
      if (userData.error) {
        console.log('❌ User data fetch error:', userData.error);
      } else {
        console.log('✅ User data fetched successfully:', {
          userName: userData.user?.name,
          hasProfile: !!userData.profile,
          hasGoals: !!userData.dailyGoals,
          todayLogsCount: userData.todayConsumption?.logCount || 0
        });
      }

      // Get response from Gemini AI
      const aiResponse = await getRecommendations(fullPrompt);

      // Clean and format the response
      const cleanedResponse = cleanAndFormatResponse(aiResponse);

      res.status(200).json({
        success: true,
        response: cleanedResponse,
        context: context,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Chatbot error:', error);
      
      // Provide helpful fallback response
      const fallbackResponse = getFallbackResponse(req.body.context);
      
      res.status(200).json({
        success: true,
        response: fallbackResponse,
        isFallback: true,
        error: 'AI service temporarily unavailable'
      });
    }
  },

  /**
   * POST /api/gemini/nutrition-question
   * Specialized endpoint for nutrition-specific questions
   */
  nutritionQuestion: async (req, res) => {
    try {
      const { question, productData = null } = req.body;

      if (!question) {
        return res.status(400).json({
          success: false,
          error: 'Question is required'
        });
      }

      // Fetch user data for personalization
      const userData = await fetchUserPersonalizationData(req.user.uid);

      // Build specialized nutrition prompt with user data
      const nutritionPrompt = buildNutritionPrompt(question, productData, userData);
      
      console.log('🥗 Processing nutrition question');

      const aiResponse = await getRecommendations(nutritionPrompt);
      const cleanedResponse = cleanAndFormatResponse(aiResponse);

      res.status(200).json({
        success: true,
        response: cleanedResponse,
        type: 'nutrition_advice',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Nutrition question error:', error);
      
      res.status(200).json({
        success: true,
        response: "I'm having trouble accessing nutritional information right now. Please try asking your question again, or consult with a registered dietitian for personalized advice.",
        isFallback: true
      });
    }
  }
};

/**
 * Get system prompt based on context
 */
function getSystemPrompt(context) {
  const prompts = {
    nutrition_assistant: `You are a ultra-concise nutrition assistant for NutriScan. 

Rules:
- Max 80 words per response
- Write in short, clear sentences
- Be direct, no fluff
- Give 1-3 actionable tips only
- Skip introductions/conclusions
- NO bullet points or lists

IMPORTANT: If user data shows profile is incomplete or goals are not set, tell them to complete their profile setup first. Don't mention specific calorie numbers if their profile is incomplete. Be consistent with the data you have.

Answer briefly and practically in paragraph form.`,

    general: `You are an ultra-concise AI assistant for NutriScan. Max 80 words. Write in short sentences, no bullets or lists. Be direct and give actionable tips in paragraph form.`,

    food_analysis: `You are a food analysis expert. Max 80 words. Write in short sentences, no bullets. Be direct and specific about nutrition facts in paragraph form.`
  };

  return prompts[context] || prompts.general;
}

/**
 * Build conversation context from history
 */
function buildConversationContext(history) {
  if (!history || history.length === 0) {
    return "This is the start of a new conversation.";
  }

  // Include last few messages for context (limit to prevent token overflow)
  const recentHistory = history.slice(-6); // Last 3 exchanges
  const contextLines = recentHistory.map(msg => 
    `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`
  );

  return `Previous conversation context:
${contextLines.join('\n')}

---`;
}

/**
 * Build specialized nutrition prompt with comprehensive user data
 */
function buildNutritionPrompt(question, productData, userData) {
  let prompt = `You are a nutrition expert helping a user with their specific question about food and nutrition.

User Question: ${question}`;

  if (productData) {
    prompt += `

Product Context:
- Name: ${productData.name || 'Unknown'}
- Brand: ${productData.brand || 'Unknown'}
- Calories per 100g: ${productData.nutrition?.calories || 'Unknown'}
- Protein: ${productData.nutrition?.protein || 'Unknown'}g
- Carbs: ${productData.nutrition?.carbs || 'Unknown'}g
- Fat: ${productData.nutrition?.fat || 'Unknown'}g
- Sugar: ${productData.nutrition?.sugar || 'Unknown'}g`;
  }

  // Add comprehensive user personalization context
  const userContext = buildUserPersonalizationContext(userData);
  prompt += `

${userContext}`;

  prompt += `

Please provide a helpful, accurate, and highly personalized response that:
- Addresses their specific question
- References their current nutrition progress and goals
- Considers their eating patterns and preferences
- Provides actionable advice based on their profile
- Is encouraging and supportive of their health journey
- Keeps the response conversational and practical`;

  return prompt;
}

/**
 * Clean and format AI response
 */
function cleanAndFormatResponse(response) {
  if (!response) return "I'm sorry, I couldn't generate a response. Please try again.";

  // Remove any unwanted prefixes or formatting
  let cleaned = response
    .replace(/^(AI Assistant:|Assistant:|Bot:)/i, '')
    .replace(/^AI:\s*/i, '')
    .trim();

  // Ensure response isn't empty after cleaning
  if (cleaned.length === 0) {
    return "I'm here to help with your nutrition questions! What would you like to know?";
  }

  // Limit length to keep responses very concise
  if (cleaned.length > 400) {
    cleaned = cleaned.substring(0, 380) + "...";
  }

  return cleaned;
}

/**
 * Get fallback response when AI fails
 */
function getFallbackResponse(context) {
  const fallbacks = {
    nutrition_assistant: "I'm having trouble connecting to my nutrition database right now. However, I'd be happy to help you with general nutrition questions! Feel free to ask about calories, macronutrients, or healthy eating tips.",
    
    food_analysis: "I'm temporarily unable to analyze food data, but I can still provide general nutrition guidance. What specific questions do you have about food and nutrition?",
    
    general: "I'm experiencing some technical difficulties, but I'm still here to help with your nutrition and health questions. What would you like to know?"
  };

  return fallbacks[context] || fallbacks.general;
}

/**
 * Fetch comprehensive user data for personalization
 */
async function fetchUserPersonalizationData(firebaseUid) {
  try {
    // Find the user
    console.log('🔍 Fetching user data for:', firebaseUid);
    
    // First, find the user
    const user = await User.findOne({ 
      where: { firebase_uid: firebaseUid }
    });

    if (!user) {
      console.log('❌ User not found for firebase_uid:', firebaseUid);
      return { error: 'User not found' };
    }

    console.log('👤 User found:', user.id, user.name);

    // Then fetch profile and daily goals separately (like other controllers do)
    const profile = await Profile.findOne({ 
      where: { userId: user.id } 
    });

    const dailyGoal = await DailyGoal.findOne({ 
      where: { userId: user.id } 
    });

    console.log('✅ Data fetched:', {
      userId: user.id,
      userName: user.name,
      hasProfile: !!profile,
      hasDailyGoals: !!dailyGoal,
      profileData: profile ? {
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        activityLevel: profile.activityLevel
      } : null,
      dailyGoalsData: dailyGoal ? {
        calories: dailyGoal.targetCalories,
        goalType: dailyGoal.goalType,
        protein: dailyGoal.targetProtein,
        carbs: dailyGoal.targetCarbs,
        fat: dailyGoal.targetFat
      } : null
    });

    // Get today's consumption logs (optimized query)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayLogs = await ConsumptionLog.findAll({
      where: { 
        userId: user.id,
        consumedAt: { 
          [Op.gte]: startOfDay 
        }
      },
      attributes: ['id', 'amountConsumed', 'calculatedCalories', 'calculatedProtein', 'calculatedCarbs', 'calculatedFat', 'consumedAt'],
      include: [{
        model: FoodItem,
        attributes: ['name', 'barcode']
      }],
      limit: 50, // Prevent huge result sets
      order: [['consumedAt', 'DESC']]
    });

    // Get recent consumption logs (last 7 days for patterns - optimized)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentLogs = await ConsumptionLog.findAll({
      where: { 
        userId: user.id,
        consumedAt: {
          [Op.gte]: sevenDaysAgo
        }
      },
      attributes: ['calculatedCalories', 'calculatedProtein', 'calculatedCarbs', 'calculatedFat', 'consumedAt', 'date'],
      include: [{
        model: FoodItem,
        attributes: ['name', 'barcode']
      }],
      order: [['consumedAt', 'DESC']],
      limit: 100 // Reasonable limit for pattern analysis
    });

    // Calculate today's totals
    const todayTotals = calculateDailyTotals(todayLogs);

    return {
      user: {
        name: user.name,
        email: user.email
      },
      profile: profile ? {
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        bmi: profile.bmi,
        activityLevel: profile.activityLevel
      } : null,
      dailyGoals: dailyGoal ? {
        calories: dailyGoal.targetCalories,
        protein: dailyGoal.targetProtein,
        carbs: dailyGoal.targetCarbs,
        fat: dailyGoal.targetFat,
        sugar: dailyGoal.targetSugar || 50, // Default sugar limit if not defined
        goalType: dailyGoal.goalType
      } : null,
      todayConsumption: {
        totals: todayTotals,
        logs: todayLogs.slice(0, 5), // Last 5 items eaten today
        logCount: todayLogs.length
      },
      recentPatterns: {
        logs: recentLogs.slice(0, 10), // Last 10 items for pattern analysis
        totalDays: 7
      }
    };

  } catch (error) {
    console.error('Error fetching user personalization data:', error);
    return { error: 'Failed to fetch user data' };
  }
}

/**
 * Calculate daily nutrition totals from consumption logs
 */
function calculateDailyTotals(logs) {
  return logs.reduce((totals, log) => {
    return {
      calories: totals.calories + (log.calculatedCalories || 0),
      protein: totals.protein + (log.calculatedProtein || 0),
      carbs: totals.carbs + (log.calculatedCarbs || 0),
      fat: totals.fat + (log.calculatedFat || 0),
      sugar: totals.sugar + (log.calculatedSugar || 0)
    };
  }, {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sugar: 0
  });
}

/**
 * Build comprehensive user personalization context for AI prompts
 */
function buildUserPersonalizationContext(userData) {
  if (userData.error) {
    return `USER CONTEXT: User data unavailable (${userData.error}) - provide general nutrition advice and suggest completing their profile for personalized recommendations.`;
  }

  let context = `USER PERSONALIZATION CONTEXT:

USER PROFILE:
- Name: ${userData.user?.name || 'Unknown'}
- Email: ${userData.user?.email || 'Unknown'}`;

  const hasProfile = userData.profile;
  const hasGoals = userData.dailyGoals;

  if (!hasProfile && !hasGoals) {
    context += `
- Profile Status: INCOMPLETE - User needs to complete onboarding first
- Daily Goals: NOT SET - Cannot provide personalized advice

IMPORTANT: Tell user they need to complete their profile setup to get personalized nutrition goals and advice.`;
    return context;
  }

  if (hasProfile) {
    context += `
- Age: ${userData.profile.age} years old
- Gender: ${userData.profile.gender}
- Height: ${userData.profile.height} cm
- Weight: ${userData.profile.weight} kg
- BMI: ${userData.profile.bmi?.toFixed(1) || 'Unknown'}
- Activity Level: ${userData.profile.activityLevel}`;
  } else {
    context += `
- Profile Status: INCOMPLETE - Basic info missing`;
  }

  if (hasGoals) {
    context += `
- Goal Type: ${userData.dailyGoals.goalType}

DAILY NUTRITION GOALS:
- Calories: ${userData.dailyGoals.calories} kcal/day
- Protein: ${userData.dailyGoals.protein}g/day
- Carbohydrates: ${userData.dailyGoals.carbs}g/day
- Fat: ${userData.dailyGoals.fat}g/day`;
  } else {
    context += `

DAILY NUTRITION GOALS: NOT SET - User needs to complete profile setup`;
  }

  if (userData.todayConsumption) {
    const totals = userData.todayConsumption.totals;
    const goals = userData.dailyGoals;

    context += `

TODAY'S PROGRESS (Current Status):
- Calories: ${Math.round(totals.calories)}/${goals?.calories || '?'} kcal (${goals ? Math.round((totals.calories / goals.calories) * 100) : '?'}%)
- Protein: ${Math.round(totals.protein)}g/${goals?.protein || '?'}g (${goals ? Math.round((totals.protein / goals.protein) * 100) : '?'}%)
- Carbs: ${Math.round(totals.carbs)}g/${goals?.carbs || '?'}g (${goals ? Math.round((totals.carbs / goals.carbs) * 100) : '?'}%)
- Fat: ${Math.round(totals.fat)}g/${goals?.fat || '?'}g (${goals ? Math.round((totals.fat / goals.fat) * 100) : '?'}%)
- Sugar: ${Math.round(totals.sugar)}g/${goals?.sugar || '?'}g (${goals ? Math.round((totals.sugar / goals.sugar) * 100) : '?'}%)

FOODS EATEN TODAY (${userData.todayConsumption.logCount} total items):`;

    if (userData.todayConsumption.logs.length > 0) {
      userData.todayConsumption.logs.forEach((log, index) => {
        const time = new Date(log.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        context += `
${index + 1}. ${time}: ${log.FoodItem?.name || 'Unknown food'} (${log.amountConsumed}g) - ${Math.round(log.calculatedCalories || 0)} kcal`;
      });
    } else {
      context += `
- No food logged today yet`;
    }
  }

  if (userData.recentPatterns && userData.recentPatterns.logs.length > 0) {
    context += `

RECENT EATING PATTERNS (Last 7 days):`;
    
    // Group by date and show summary
    const dailySummary = {};
    userData.recentPatterns.logs.forEach(log => {
      const date = log.date || log.consumedAt?.split('T')[0] || 'Unknown date';
      if (!dailySummary[date]) {
        dailySummary[date] = { items: [], totalCalories: 0 };
      }
      const foodName = log.FoodItem?.name || 'Unknown food';
      dailySummary[date].items.push(foodName);
      dailySummary[date].totalCalories += log.calculatedCalories || 0;
    });

    Object.entries(dailySummary).slice(0, 3).forEach(([date, summary]) => {
      context += `
- ${date}: ${Math.round(summary.totalCalories)} kcal (${summary.items.slice(0, 3).join(', ')}${summary.items.length > 3 ? '...' : ''})`;
    });
  }

  context += `

PERSONALIZATION INSTRUCTIONS:
- ONLY use data that is actually available - don't contradict yourself
- If profile is incomplete, tell user to complete setup first
- If daily goals exist, reference them specifically
- If no goals are set, don't mention specific calorie numbers
- Be consistent - don't say "goal undefined" then mention specific calorie targets
- Provide advice based only on the data you actually have`;

  return context;
}

module.exports = chatbotController;
