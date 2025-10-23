const sequelize = require('../config/database');

// Import all models
const User = require('./User');
const Profile = require('./Profile');
const DailyGoals = require('./DailyGoals');
const FoodItem = require('./FoodItem');
const ConsumptionLog = require('./ConsumptionLog');

// Define associations
// User has one Profile
User.hasOne(Profile, {
  foreignKey: 'user_id',
  as: 'profile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Profile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has one DailyGoals
User.hasOne(DailyGoals, {
  foreignKey: 'user_id',
  as: 'dailyGoals',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

DailyGoals.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has many ConsumptionLogs
User.hasMany(ConsumptionLog, {
  foreignKey: 'user_id',
  as: 'consumptionLogs',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

ConsumptionLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// FoodItem has many ConsumptionLogs
FoodItem.hasMany(ConsumptionLog, {
  foreignKey: 'food_item_id',
  as: 'consumptionLogs',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

ConsumptionLog.belongsTo(FoodItem, {
  foreignKey: 'food_item_id',
  as: 'foodItem'
});

// Sync database function
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error;
  }
};

// Initialize database function
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models
    await syncDatabase();
    
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Profile,
  DailyGoals,
  FoodItem,
  ConsumptionLog,
  syncDatabase,
  initializeDatabase
}; 