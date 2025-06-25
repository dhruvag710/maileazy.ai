const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Email = sequelize.define('Email', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  gmail_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true
  },
  snippet: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM(
      'Meeting Invitations & Scheduling',
      'Internship Applications & Correspondence',
      'Academic & Administrative Notices',
      'Financial Transactions & Billing',
      'Banking & Investments',
      'Orders, Deliveries & Purchases',
      'Research, Collaborations & Grants',
      'Personal, Promotions & Spam'
    ),
    allowNull: false,
    defaultValue: 'Personal, Promotions & Spam'
  },
  priority: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    allowNull: false,
    defaultValue: 'low'
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fetched_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  internship_analysis: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Stores internship email analysis including summary and candidate info'
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['gmail_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['category']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['deadline']
    }
  ]
});

// Define relationship
Email.belongsTo(User, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});

User.hasMany(Email, {
  foreignKey: 'user_id'
});

module.exports = Email; 