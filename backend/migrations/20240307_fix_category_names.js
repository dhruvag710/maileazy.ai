'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Step 1: Create a temporary column with the correct enum
      await queryInterface.addColumn('Emails', 'category_new', {
        type: Sequelize.ENUM(
          'Meetings',
          'Internships',
          'College Exams & Others',
          'Bills & Payments',
          'Banking & Finance',
          'Orders & Deliveries',
          'Others',
          'Rejected / Spam'
        ),
        allowNull: true
      });

      // Step 2: Update the data in the new column
      await queryInterface.sequelize.query(`
        UPDATE Emails
        SET category_new = CASE
          WHEN category = 'Meeting Invitations & Scheduling' THEN 'Meetings'
          WHEN category = 'Internship Applications & Correspondence' THEN 'Internships'
          WHEN category = 'Academic & Administrative Notices' THEN 'College Exams & Others'
          WHEN category = 'Financial Transactions & Billing' THEN 'Bills & Payments'
          WHEN category = 'Banking & Investments' THEN 'Banking & Finance'
          WHEN category = 'Orders, Deliveries & Purchases' THEN 'Orders & Deliveries'
          WHEN category = 'Research, Collaborations & Grants' THEN 'Others'
          WHEN category = 'Personal, Promotions & Spam' THEN 'Rejected / Spam'
          ELSE 'Others'
        END
      `);

      // Step 3: Drop the old category column
      await queryInterface.removeColumn('Emails', 'category');

      // Step 4: Rename the new column to category
      await queryInterface.renameColumn('Emails', 'category_new', 'category');

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Step 1: Create a temporary column with the old enum
      await queryInterface.addColumn('Emails', 'category_old', {
        type: Sequelize.ENUM(
          'Meeting Invitations & Scheduling',
          'Internship Applications & Correspondence',
          'Academic & Administrative Notices',
          'Financial Transactions & Billing',
          'Banking & Investments',
          'Orders, Deliveries & Purchases',
          'Research, Collaborations & Grants',
          'Personal, Promotions & Spam'
        ),
        allowNull: true
      });

      // Step 2: Update the data back to old categories
      await queryInterface.sequelize.query(`
        UPDATE Emails
        SET category_old = CASE
          WHEN category = 'Meetings' THEN 'Meeting Invitations & Scheduling'
          WHEN category = 'Internships' THEN 'Internship Applications & Correspondence'
          WHEN category = 'College Exams & Others' THEN 'Academic & Administrative Notices'
          WHEN category = 'Bills & Payments' THEN 'Financial Transactions & Billing'
          WHEN category = 'Banking & Finance' THEN 'Banking & Investments'
          WHEN category = 'Orders & Deliveries' THEN 'Orders, Deliveries & Purchases'
          WHEN category = 'Others' THEN 'Research, Collaborations & Grants'
          WHEN category = 'Rejected / Spam' THEN 'Personal, Promotions & Spam'
          ELSE 'Personal, Promotions & Spam'
        END
      `);

      // Step 3: Drop the new category column
      await queryInterface.removeColumn('Emails', 'category');

      // Step 4: Rename the old column back to category
      await queryInterface.renameColumn('Emails', 'category_old', 'category');

    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
}; 