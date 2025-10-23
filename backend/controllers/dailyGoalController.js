const { DailyGoal, User, Profile } = require('../models/relations');

// Helper function to calculate personalized daily goals
const calculatePersonalizedGoals = (profile, goalType) => {
  const { age, gender, height, weight, activityLevel } = profile;
  
  // Base Metabolic Rate (BMR) calculation using Mifflin-St Jeor Equation
  let bmr;
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  
  // Activity level multipliers
  const activityMultipliers = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725,
    'extra_active': 1.9
  };
  
  // Total Daily Energy Expenditure (TDEE)
  const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);
  
  // Goal adjustments
  let calorieGoal;
  switch (goalType) {
    case 'lose_weight':
      calorieGoal = Math.round(tdee - 500); // 500 calorie deficit for ~1lb/week loss
      break;
    case 'gain_weight':
      calorieGoal = Math.round(tdee + 500); // 500 calorie surplus for ~1lb/week gain
      break;
    default: // maintain
      calorieGoal = Math.round(tdee);
  }
  
  // Macronutrient distribution (moderate approach)
  const proteinCaloriesPerGram = 4;
  const carbCaloriesPerGram = 4;
  const fatCaloriesPerGram = 9;
  
  // Protein: 25% of calories (higher for weight loss, moderate for others)
  const proteinPercentage = goalType === 'lose_weight' ? 0.3 : 0.25;
  const proteinGrams = Math.round((calorieGoal * proteinPercentage) / proteinCaloriesPerGram);
  
  // Fat: 25% of calories
  const fatPercentage = 0.25;
  const fatGrams = Math.round((calorieGoal * fatPercentage) / fatCaloriesPerGram);
  
  // Carbs: remaining calories
  const remainingCalories = calorieGoal - (proteinGrams * proteinCaloriesPerGram) - (fatGrams * fatCaloriesPerGram);
  const carbGrams = Math.round(remainingCalories / carbCaloriesPerGram);
  
  return {
    targetCalories: calorieGoal,
    targetProtein: proteinGrams,
    targetCarbs: carbGrams,
    targetFat: fatGrams
  };
};

const dailyGoalController = {
  // POST /api/goals - Create or calculate daily goals
  createDailyGoal: async (req, res) => {
    try {
      console.log('🎯 Creating daily goal for user:', req.user.uid);
      let { targetCalories, targetCarbs, targetProtein, targetFat, goalType, autoCalculate = true } = req.body;
      console.log('🎯 Goal data received:', { targetCalories, targetCarbs, targetProtein, targetFat, goalType, autoCalculate });
      
      const user = await User.findOne({ 
        where: { firebase_uid: req.user.uid } 
      });

      if (!user) {
        console.log('❌ User not found in database');
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      console.log('👤 User found:', user.id);

      // Check if daily goal already exists
      const existingGoal = await DailyGoal.findOne({ 
        where: { userId: user.id } 
      });

      if (existingGoal) {
        console.log('❌ Daily goal already exists');
        return res.status(400).json({ 
          error: 'Daily goal already exists. Use PUT to update.' 
        });
      }

      // Auto-calculate goals based on profile if requested or if no manual values provided
      if (autoCalculate || !targetCalories) {
        console.log('🧮 Auto-calculating goals...');
        const profile = await Profile.findOne({ 
          where: { userId: user.id } 
        });

        if (!profile) {
          console.log('❌ Profile not found for auto-calculation');
          return res.status(400).json({ 
            error: 'Profile required for auto-calculation. Create profile first or provide manual values.' 
          });
        }

        // Use goalType from request or default to 'maintain'
        const goalTypeToUse = goalType || 'maintain';
        console.log('🎯 Using goal type:', goalTypeToUse);

        const calculatedGoals = calculatePersonalizedGoals(profile, goalTypeToUse);
        targetCalories = calculatedGoals.targetCalories;
        targetCarbs = calculatedGoals.targetCarbs;
        targetProtein = calculatedGoals.targetProtein;
        targetFat = calculatedGoals.targetFat;
        goalType = goalTypeToUse;

        console.log('🧮 Calculated goals:', calculatedGoals);
      }

      // Ensure goalType is provided
      if (!goalType) {
        console.log('❌ Goal type is required');
        return res.status(400).json({ 
          error: 'goalType is required (lose_weight, gain_weight, or maintain)' 
        });
      }

      // Create new daily goal
      console.log('💾 Creating daily goal in database...');
      const dailyGoal = await DailyGoal.create({
        userId: user.id,
        goalType,
        targetCalories,
        targetCarbs,
        targetProtein,
        targetFat,
        isAutoCalculated: autoCalculate
      });

      console.log('✅ Daily goal created successfully:', dailyGoal.id);

      res.status(201).json({
        message: 'Daily goal created successfully',
        dailyGoal,
        autoCalculated: autoCalculate
      });

    } catch (error) {
      console.error('❌ Create daily goal error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        errors: error.errors // Sequelize validation errors
      });
      res.status(500).json({ 
        error: 'Failed to create daily goal',
        details: error.message
      });
    }
  },

  // GET /api/goals - Get user's daily goals
  getDailyGoal: async (req, res) => {
    try {
      console.log('🎯 Getting daily goals for user:', req.user.uid);
      
      const user = await User.findOne({ 
        where: { firebase_uid: req.user.uid } 
      });

      if (!user) {
        console.log('❌ User not found in database');
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      console.log('👤 User found:', user.id);

      let dailyGoal = await DailyGoal.findOne({ 
        where: { userId: user.id },
        include: [{
          model: User,
          attributes: ['id', 'email', 'name']
        }]
      });

      // If no daily goal exists, auto-create one based on profile
      if (!dailyGoal) {
        console.log('🎯 No daily goal found - auto-creating based on profile...');
        
        const profile = await Profile.findOne({ 
          where: { userId: user.id } 
        });

        if (!profile) {
          console.log('❌ Profile not found for auto-calculation');
          return res.status(400).json({ 
            error: 'Profile required to calculate daily goals. Please complete your profile first.' 
          });
        }

        console.log('👤 Profile found - calculating goals...');
        const calculatedGoals = calculatePersonalizedGoals(profile, 'maintain'); // Default to maintain
        
        console.log('🧮 Auto-calculated goals:', calculatedGoals);
        
        dailyGoal = await DailyGoal.create({
          userId: user.id,
          goalType: 'maintain',
          targetCalories: calculatedGoals.targetCalories,
          targetCarbs: calculatedGoals.targetCarbs,
          targetProtein: calculatedGoals.targetProtein,
          targetFat: calculatedGoals.targetFat,
          isAutoCalculated: true
        });
        
        console.log('✅ Daily goals auto-created:', dailyGoal.id);
        
        // Fetch the created goal with user info
        dailyGoal = await DailyGoal.findOne({ 
          where: { userId: user.id },
          include: [{
            model: User,
            attributes: ['id', 'email', 'name']
          }]
        });
      }

      console.log('✅ Returning daily goals:', {
        id: dailyGoal.id,
        calories: dailyGoal.targetCalories,
        protein: dailyGoal.targetProtein,
        carbs: dailyGoal.targetCarbs,
        fat: dailyGoal.targetFat
      });

      res.status(200).json({ dailyGoal });

    } catch (error) {
      console.error('Get daily goal error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch daily goal' 
      });
    }
  },

  // PUT /api/goals - Update user's daily goals
  updateDailyGoal: async (req, res) => {
    try {
      let { calories, carbs, proteins, fats, sugars, autoCalculate = false } = req.body;
      
      const user = await User.findOne({ 
        where: { firebase_uid: req.user.uid } 
      });

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      const dailyGoal = await DailyGoal.findOne({ 
        where: { userId: user.id } 
      });

      if (!dailyGoal) {
        return res.status(404).json({ 
          error: 'Daily goal not found' 
        });
      }

      // Auto-calculate goals based on profile if requested
      if (autoCalculate) {
        const profile = await Profile.findOne({ 
          where: { userId: user.id } 
        });

        if (!profile) {
          return res.status(400).json({ 
            error: 'Profile required for auto-calculation.' 
          });
        }

        const calculatedGoals = calculatePersonalizedGoals(profile);
        calories = calculatedGoals.calories;
        carbs = calculatedGoals.carbs;
        proteins = calculatedGoals.proteins;
        fats = calculatedGoals.fats;
        sugars = calculatedGoals.sugars;
      }

      // Update daily goal
      await dailyGoal.update({
        calories: calories !== undefined ? calories : dailyGoal.calories,
        carbs: carbs !== undefined ? carbs : dailyGoal.carbs,
        proteins: proteins !== undefined ? proteins : dailyGoal.proteins,
        fats: fats !== undefined ? fats : dailyGoal.fats,
        sugars: sugars !== undefined ? sugars : dailyGoal.sugars
      });

      res.status(200).json({
        message: 'Daily goal updated successfully',
        dailyGoal,
        autoCalculated: autoCalculate
      });

    } catch (error) {
      console.error('Update daily goal error:', error);
      res.status(500).json({ 
        error: 'Failed to update daily goal' 
      });
    }
  },

  // DELETE /api/goals - Delete user's daily goals
  deleteDailyGoal: async (req, res) => {
    try {
      const user = await User.findOne({ 
        where: { firebase_uid: req.user.uid } 
      });

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      const dailyGoal = await DailyGoal.findOne({ 
        where: { userId: user.id } 
      });

      if (!dailyGoal) {
        return res.status(404).json({ 
          error: 'Daily goal not found' 
        });
      }

      await dailyGoal.destroy();

      res.status(200).json({
        message: 'Daily goal deleted successfully'
      });

    } catch (error) {
      console.error('Delete daily goal error:', error);
      res.status(500).json({ 
        error: 'Failed to delete daily goal' 
      });
    }
  },

  // GET /api/goals/calculate - Preview calculated goals without saving
  previewCalculatedGoals: async (req, res) => {
    try {
      const user = await User.findOne({ 
        where: { firebase_uid: req.user.uid } 
      });

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      const profile = await Profile.findOne({ 
        where: { userId: user.id } 
      });

      if (!profile) {
        return res.status(400).json({ 
          error: 'Profile required for goal calculation. Create profile first.' 
        });
      }

      const calculatedGoals = calculatePersonalizedGoals(profile);

      res.status(200).json({
        message: 'Calculated goals based on your profile',
        calculatedGoals,
        profileData: {
          bmi: profile.bmi,
          activityLevel: profile.activityLevel,
          goalType: profile.goalType
        }
      });

    } catch (error) {
      console.error('Preview calculated goals error:', error);
      res.status(500).json({ 
        error: 'Failed to calculate goals' 
      });
    }
  }
};

module.exports = dailyGoalController; 