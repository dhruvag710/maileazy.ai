const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'smart_mail',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: console.log, // Enable logging to debug connection issues
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      timezone: '+00:00'
    },
    timezone: '+00:00',
    // Add these options for better data persistence
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
      charset: 'utf8mb4',
      dialectOptions: {
        collate: 'utf8mb4_unicode_ci'
      }
    }
  }
);

// Test the connection and create database if it doesn't exist
const initializeDatabase = async () => {
  try {
    // First try to connect
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Create database if it doesn't exist
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'smart_mail'};`);
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

module.exports = { sequelize, initializeDatabase }; 