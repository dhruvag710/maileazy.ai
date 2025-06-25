'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Update existing email records with new category names
      await queryInterface.sequelize.query(`
        UPDATE Emails
        SET category = CASE
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

      console.log('Successfully updated email categories');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Revert the changes
      await queryInterface.sequelize.query(`
        UPDATE Emails
        SET category = CASE
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

      console.log('Successfully reverted email categories');
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
}; 