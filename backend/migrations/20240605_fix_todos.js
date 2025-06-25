const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check if email_subject column exists
    const tableInfo = await queryInterface.describeTable('todos');
    
    if (tableInfo.email_subject) {
      // If it exists, modify it to allow null
      await queryInterface.changeColumn('todos', 'email_subject', {
        type: DataTypes.STRING,
        allowNull: true
      });
    } else {
      // If it doesn't exist, add it
      await queryInterface.addColumn('todos', 'email_subject', {
        type: DataTypes.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Don't remove the column in down migration as it might contain important data
    await queryInterface.changeColumn('todos', 'email_subject', {
      type: DataTypes.STRING,
      allowNull: false
    });
  }
}; 