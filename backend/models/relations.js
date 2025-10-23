const User = require('./User');
const Profile = require('./Profile');
const DailyGoal = require('./DailyGoal');
const FoodItem = require('./FoodItem');
const ConsumptionLog = require('./ConsumptionLog');

// User - Profile (One-to-One)
User.hasOne(Profile, { foreignKey: 'userId', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'userId' });

// User - DailyGoal (One-to-One)
User.hasOne(DailyGoal, { foreignKey: 'userId', as: 'dailyGoals' });
DailyGoal.belongsTo(User, { foreignKey: 'userId' });

// User - ConsumptionLog (One-to-Many)
User.hasMany(ConsumptionLog, { foreignKey: 'userId' });
ConsumptionLog.belongsTo(User, { foreignKey: 'userId' });

// FoodItem - ConsumptionLog (One-to-Many)
FoodItem.hasMany(ConsumptionLog, { foreignKey: 'barcode', sourceKey: 'barcode' });
ConsumptionLog.belongsTo(FoodItem, { foreignKey: 'barcode', targetKey: 'barcode' });

module.exports = {
  User,
  Profile,
  DailyGoal,
  FoodItem,
  ConsumptionLog
}; 