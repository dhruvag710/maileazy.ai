const { sequelize } = require('../config/database');
const User = require('../models/User');
const Email = require('../models/Email');
const Todo = require('../models/Todo');

async function clearAllData() {
  try {
    console.log('Starting database cleanup...');
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Use a transaction to ensure all operations succeed or none do
    await sequelize.transaction(async (transaction) => {
      // Delete all todos
      console.log('Deleting all todos...');
      await Todo.destroy({
        where: {},
        force: true,
        transaction
      });
      console.log('✓ All todos deleted');

      // Delete all emails
      console.log('Deleting all emails...');
      await Email.destroy({
        where: {},
        force: true,
        transaction
      });
      console.log('✓ All emails deleted');

      // Delete all users
      console.log('Deleting all users...');
      await User.destroy({
        where: {},
        force: true,
        transaction
      });
      console.log('✓ All users deleted');
    });

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✓ Database cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during database cleanup:', error);
    // Make sure to re-enable foreign key checks even if there's an error
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (err) {
      console.error('Error re-enabling foreign key checks:', err);
    }
    process.exit(1);
  }
}

// Run the cleanup
clearAllData(); 