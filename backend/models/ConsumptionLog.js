const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConsumptionLog = sequelize.define('ConsumptionLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'FoodItems',
      key: 'barcode'
    }
  },
  amountConsumed: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  consumedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  calculatedCalories: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  calculatedProtein: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  calculatedCarbs: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  calculatedFat: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  calculatedFiber: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  calculatedSugar: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  calculatedSodium: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  isManualEntry: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = ConsumptionLog; 