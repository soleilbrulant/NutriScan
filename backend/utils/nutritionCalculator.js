/**
 * Calculate daily nutritional goals based on user profile
 * Uses Harris-Benedict equation for BMR and activity multipliers
 */

const calculateBMR = (weight_kg, height_cm, age, gender) => {
  if (gender === 'male') {
    return 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age);
  }
};

const getActivityMultiplier = (activity_level) => {
  const multipliers = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725,
    'extremely_active': 1.9
  };
  return multipliers[activity_level] || 1.2;
};

const getGoalMultiplier = (goal_type) => {
  const multipliers = {
    'loss': 0.8,      // 20% deficit
    'maintain': 1.0,   // maintenance
    'gain': 1.2       // 20% surplus
  };
  return multipliers[goal_type] || 1.0;
};

const calculateDailyGoals = (profile) => {
  const { weight_kg, height_cm, age, gender, activity_level, goal_type } = profile;
  
  // Calculate BMR
  const bmr = calculateBMR(weight_kg, height_cm, age, gender);
  
  // Calculate TDEE (Total Daily Energy Expenditure)
  const activityMultiplier = getActivityMultiplier(activity_level);
  const tdee = bmr * activityMultiplier;
  
  // Adjust for goal
  const goalMultiplier = getGoalMultiplier(goal_type);
  const targetCalories = Math.round(tdee * goalMultiplier);
  
  // Calculate macronutrients (standard ratios)
  const carbsPercentage = 0.45;  // 45% carbs
  const proteinPercentage = 0.25; // 25% protein
  const fatPercentage = 0.30;    // 30% fat
  
  const carbs_g = Math.round((targetCalories * carbsPercentage) / 4); // 4 cal per gram
  const proteins_g = Math.round((targetCalories * proteinPercentage) / 4); // 4 cal per gram
  const fats_g = Math.round((targetCalories * fatPercentage) / 9); // 9 cal per gram
  
  // Calculate other nutrients
  const sugar_g = Math.round(carbs_g * 0.2); // Max 20% of carbs as sugar
  const fiber_g = Math.round(targetCalories / 80); // ~14g per 1000 calories
  const sodium_mg = 2300; // Standard daily limit
  
  return {
    calories: targetCalories,
    carbs_g,
    proteins_g,
    fats_g,
    sugar_g,
    fiber_g,
    sodium_mg
  };
};

const calculateNutritionalValues = (foodItem, amount_g) => {
  const multiplier = amount_g / 100; // Convert from per 100g to actual amount
  
  return {
    actual_calories: foodItem.calories_per_100g ? 
      Math.round(foodItem.calories_per_100g * multiplier * 100) / 100 : null,
    actual_carbs_g: foodItem.carbs_per_100g ? 
      Math.round(foodItem.carbs_per_100g * multiplier * 100) / 100 : null,
    actual_proteins_g: foodItem.proteins_per_100g ? 
      Math.round(foodItem.proteins_per_100g * multiplier * 100) / 100 : null,
    actual_fats_g: foodItem.fats_per_100g ? 
      Math.round(foodItem.fats_per_100g * multiplier * 100) / 100 : null,
    actual_sugar_g: foodItem.sugar_per_100g ? 
      Math.round(foodItem.sugar_per_100g * multiplier * 100) / 100 : null,
    actual_fiber_g: foodItem.fiber_per_100g ? 
      Math.round(foodItem.fiber_per_100g * multiplier * 100) / 100 : null,
    actual_sodium_mg: foodItem.sodium_per_100g ? 
      Math.round(foodItem.sodium_per_100g * multiplier * 100) / 100 : null
  };
};

module.exports = {
  calculateDailyGoals,
  calculateNutritionalValues,
  calculateBMR,
  getActivityMultiplier,
  getGoalMultiplier
}; 