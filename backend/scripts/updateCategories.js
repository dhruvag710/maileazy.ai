const { sequelize } = require('../config/database');
const Email = require('../models/Email');

async function updateCategories() {
  try {
    // Update the enum type first
    await sequelize.query(`
      ALTER TABLE Emails 
      MODIFY COLUMN category ENUM(
        'Meeting Invitations & Scheduling',
        'Internship Applications & Correspondence',
        'Academic & Administrative Notices',
        'Financial Transactions & Billing',
        'Banking & Investments',
        'Orders, Deliveries & Purchases',
        'Research, Collaborations & Grants',
        'Personal, Promotions & Spam'
      ) NOT NULL DEFAULT 'Personal, Promotions & Spam'
    `);

    // Update the data
    await sequelize.query(`
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

    console.log('Successfully updated categories');
    process.exit(0);
  } catch (error) {
    console.error('Error updating categories:', error);
    process.exit(1);
  }
}

updateCategories(); 