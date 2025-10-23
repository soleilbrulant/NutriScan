const { Profile, User, DailyGoal } = require('../models/relations');
const sequelize = require('../config/database');

// Helper function to calculate BMI
const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100; // Convert cm to meters
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

// Helper function to calculate personalized daily goals (copied from dailyGoalController)
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
  
  // Goal adjustments - map frontend values to backend values
  let calorieGoal;
  switch (goalType) {
    case 'lose':
    case 'lose_weight':
      calorieGoal = Math.round(tdee - 500); // 500 calorie deficit for ~1lb/week loss
      break;
    case 'gain':
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
  const proteinPercentage = (goalType === 'lose' || goalType === 'lose_weight') ? 0.3 : 0.25;
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

const profileController = {
  // POST /api/profile - Create user profile
  createProfile: async (req, res) => {
    // Start a database transaction
    const transaction = await sequelize.transaction();
    
    try {
      console.log('📝 Starting profile creation for user:', req.user.uid);
      const { age, gender, height, weight, activityLevel, goalType } = req.body;
      console.log('📝 Profile data received:', { age, gender, height, weight, activityLevel, goalType });
      
      // Validate required fields
      if (!age || !gender || !height || !weight || !activityLevel) {
        console.log('❌ Missing required fields');
        await transaction.rollback();
        return res.status(400).json({ 
          error: 'Missing required fields: age, gender, height, weight, activityLevel' 
        });
      }
      
      // Get user from database with transaction
      console.log('🔍 Finding user with Firebase UID:', req.user.uid);
      const user = await User.findOne({ 
        where: { firebase_uid: req.user.uid },
        transaction
      });

      if (!user) {
        console.log('❌ User not found in database');
        await transaction.rollback();
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      console.log('👤 User found:', {
        id: user.id,
        email: user.email,
        name: user.name
      });

      // Check if profile already exists
      console.log('🔍 Checking for existing profile...');
      const existingProfile = await Profile.findOne({ 
        where: { userId: user.id },
        transaction
      });

      if (existingProfile) {
        console.log('❌ Profile already exists for user:', user.id);
        await transaction.rollback();
        return res.status(400).json({ 
          error: 'Profile already exists. Use PUT to update.' 
        });
      }

      // Calculate BMI automatically
      const calculatedBMI = calculateBMI(weight, height);
      console.log('🧮 Calculated BMI:', calculatedBMI);

      // Prepare profile data
      const profileData = {
        userId: user.id,
        age: parseInt(age),
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        bmi: calculatedBMI,
        activityLevel
      };
      
      console.log('💾 Creating profile in database with data:', profileData);
      
      // Create new profile using the association method
      const profile = await user.createProfile(profileData, { transaction });
      
      console.log('✅ Profile created successfully:', {
        id: profile.id,
        userId: profile.userId,
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        bmi: profile.bmi,
        activityLevel: profile.activityLevel
      });

      // Automatically create daily goals based on the profile and goalType
      console.log('🎯 Auto-creating daily goals...');
      const goalTypeToUse = goalType || 'maintain'; // Default to maintain if not provided
      console.log('🎯 Using goal type:', goalTypeToUse);
      
      try {
        const calculatedGoals = calculatePersonalizedGoals(profile, goalTypeToUse);
        console.log('🧮 Calculated goals:', calculatedGoals);
        
        // Map frontend goal types to backend goal types
        let backendGoalType;
        switch (goalTypeToUse) {
          case 'lose':
            backendGoalType = 'lose_weight';
            break;
          case 'gain':
            backendGoalType = 'gain_weight';
            break;
          default:
            backendGoalType = 'maintain';
        }
        
        console.log('🎯 Mapped goal type:', goalTypeToUse, '->', backendGoalType);
        
        const dailyGoal = await DailyGoal.create({
          userId: user.id,
          goalType: backendGoalType,
          targetCalories: calculatedGoals.targetCalories,
          targetCarbs: calculatedGoals.targetCarbs,
          targetProtein: calculatedGoals.targetProtein,
          targetFat: calculatedGoals.targetFat,
          isAutoCalculated: true
        }, { transaction });
        
        console.log('✅ Daily goals created successfully:', {
          id: dailyGoal.id,
          userId: dailyGoal.userId,
          goalType: dailyGoal.goalType,
          targetCalories: dailyGoal.targetCalories,
          targetProtein: dailyGoal.targetProtein,
          targetCarbs: dailyGoal.targetCarbs,
          targetFat: dailyGoal.targetFat
        });

        // Commit the transaction
        await transaction.commit();
        console.log('✅ Transaction committed successfully - Profile and Daily Goals created');

        // Verify the profile was saved by reading it back
        const savedProfile = await Profile.findOne({
          where: { userId: user.id },
          include: [{
            model: User,
            attributes: ['id', 'email', 'name']
          }]
        });
        
        console.log('🔍 Verification - Profile saved in database:', !!savedProfile);

        res.status(201).json({
          message: 'Profile and daily goals created successfully',
          profile: {
            ...profile.toJSON(),
            bmiCategory: getBMICategory(calculatedBMI)
          },
          dailyGoals: {
            calories: dailyGoal.targetCalories,
            protein: dailyGoal.targetProtein,
            carbs: dailyGoal.targetCarbs,
            fat: dailyGoal.targetFat
          }
        });
        
      } catch (goalError) {
        console.error('❌ Error creating daily goals:', goalError);
        console.log('🔄 Profile created successfully, but daily goals failed. Continuing without goals...');
        
        // Commit the transaction (profile is still created)
        await transaction.commit();
        console.log('✅ Transaction committed - Profile created without goals');

        res.status(201).json({
          message: 'Profile created successfully (daily goals will be created later)',
          profile: {
            ...profile.toJSON(),
            bmiCategory: getBMICategory(calculatedBMI)
          },
          warning: 'Daily goals could not be created automatically but will be available on first access'
        });
      }

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('❌ Create profile error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        sql: error.sql, // Sequelize SQL error if any
        errors: error.errors // Sequelize validation errors
      });
      
      res.status(500).json({ 
        error: 'Failed to create profile',
        details: error.message
      });
    }
  },

  // GET /api/profile - Get user's profile
  getProfile: async (req, res) => {
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
        where: { userId: user.id },
        include: [{
          model: User,
          attributes: ['id', 'email', 'name', 'pictureUrl']
        }]
      });

      if (!profile) {
        return res.status(404).json({ 
          error: 'Profile not found' 
        });
      }

      res.status(200).json({ 
        profile: {
          ...profile.toJSON(),
          bmiCategory: getBMICategory(profile.bmi)
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch profile' 
      });
    }
  },

  // PUT /api/profile - Update user's profile
  updateProfile: async (req, res) => {
    try {
      const { age, gender, height, weight, activityLevel, goalType } = req.body;
      
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
        return res.status(404).json({ 
          error: 'Profile not found' 
        });
      }

      // Calculate new BMI if height or weight changed
      const newHeight = height !== undefined ? height : profile.height;
      const newWeight = weight !== undefined ? weight : profile.weight;
      const calculatedBMI = calculateBMI(newWeight, newHeight);

      // Update profile
      await profile.update({
        age: age !== undefined ? age : profile.age,
        gender: gender !== undefined ? gender : profile.gender,
        height: newHeight,
        weight: newWeight,
        bmi: calculatedBMI,
        activityLevel: activityLevel !== undefined ? activityLevel : profile.activityLevel,
        goalType: goalType !== undefined ? goalType : profile.goalType
      });

      res.status(200).json({
        message: 'Profile updated successfully',
        profile: {
          ...profile.toJSON(),
          bmiCategory: getBMICategory(calculatedBMI)
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        error: 'Failed to update profile' 
      });
    }
  },

  // DELETE /api/profile - Delete user's profile
  deleteProfile: async (req, res) => {
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
        return res.status(404).json({ 
          error: 'Profile not found' 
        });
      }

      await profile.destroy();

      res.status(200).json({
        message: 'Profile deleted successfully'
      });

    } catch (error) {
      console.error('Delete profile error:', error);
      res.status(500).json({ 
        error: 'Failed to delete profile' 
      });
    }
  }
};

// Helper function to categorize BMI
const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'underweight';
  if (bmi >= 18.5 && bmi < 25) return 'normal';
  if (bmi >= 25 && bmi < 30) return 'overweight';
  return 'obese';
};

module.exports = profileController; 