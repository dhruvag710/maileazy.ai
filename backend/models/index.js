const sequelize = require('../config/db');
const Todo = require('./Todo');
const User = require('./User');

// Define associations
Todo.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Todo, { foreignKey: 'user_id' });

// Sync all models
async function syncModels() {
  try {
    await sequelize.sync();
    console.log('Database models synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database models:', error);
  }
}

syncModels();

module.exports = {
  sequelize,
  Todo,
  User
}; 