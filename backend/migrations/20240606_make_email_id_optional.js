'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('todos', 'email_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'emails',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('todos', 'email_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'emails',
        key: 'id'
      }
    });
  }
}; 