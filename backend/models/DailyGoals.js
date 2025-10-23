const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyGoals = sequelize.define('DailyGoals', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  calories: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: false,
    defaultValue: 2000.00,
    validate: {
      min: 800.0,
      max: 10000.0
    }
  },
  carbs_g: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 250.00,
    validate: {
      min: 0.0,
      max: 2000.0
    }
  },
  proteins_g: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 150.00,
    validate: {
      min: 0.0,
      max: 1000.0
    }
  },
  fats_g: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 65.00,
    validate: {
      min: 0.0,
      max: 500.0
    }
  },
  sugar_g: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 50.00,
    validate: {
      min: 0.0,
      max: 500.0
    }
  },
  fiber_g: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    defaultValue: 25.00,
    validate: {
      min: 0.0,
      max: 200.0
    }
  },
  sodium_mg: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    defaultValue: 2300.00,
    validate: {
      min: 0.0,
      max: 10000.0
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'daily_goals',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id']
    }
  ]
});

module.exports = DailyGoals; 