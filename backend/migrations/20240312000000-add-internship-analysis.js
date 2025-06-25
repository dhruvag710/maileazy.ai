'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Emails', 'internship_analysis', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Stores internship email analysis including summary and candidate info'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Emails', 'internship_analysis');
  }
}; 