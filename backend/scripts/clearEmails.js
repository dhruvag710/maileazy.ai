const { sequelize } = require('../config/database');

async function clearEmailData() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Starting to clear email and todo data...');
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
    
    // Clear todos
    console.log('Clearing todos...');
    await sequelize.query('TRUNCATE TABLE todos', { transaction });
    console.log('Successfully cleared todos.');
    
    // Clear emails
    console.log('Clearing emails...');
    await sequelize.query('TRUNCATE TABLE emails', { transaction });
    console.log('Successfully cleared emails.');
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    console.log('All data cleared successfully!');
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();
    console.error('Error clearing data:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the script
clearEmailData(); 