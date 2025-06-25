const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('Starting database initialization...');

// Check if environment variables are set
const envCheck = {
  DB_NAME: process.env.DB_NAME ? 'Set' : 'Not Set',
  DB_USER: process.env.DB_USER ? 'Set' : 'Not Set',
  DB_HOST: process.env.DB_HOST ? 'Set' : 'Not Set',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not Set',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set'
};

console.log('Environment check:', envCheck);

const sequelize = new Sequelize(
  process.env.DB_NAME || 'smart_mail',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'root',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection and create database if it doesn't exist
async function initializeDatabase() {
  try {
    // First try to connect
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Create database if it doesn't exist
    await sequelize.query('CREATE DATABASE IF NOT EXISTS smart_mail;');
    console.log('Syncing database models...');

    // Sync all models
    await sequelize.sync();
    console.log('Database & tables synced successfully!');

    // Verify tables
    await Promise.all([
      sequelize.models.User?.findOne(),
      sequelize.models.Email?.findOne()
    ]);
    console.log('Database tables verified successfully');

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

initializeDatabase();

module.exports = sequelize; 