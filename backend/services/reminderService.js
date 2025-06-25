const cron = require('node-cron');
const { Op } = require('sequelize');
const Todo = require('../models/Todo');
const Email = require('../models/Email');
const User = require('../models/User');

// Function to check and send reminders
async function checkAndSendReminders() {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all todos that are due within 24 hours and haven't been reminded yet
    const upcomingTodos = await Todo.findAll({
      where: {
        deadline: {
          [Op.between]: [now, tomorrow]
        },
        reminded: false,
        completed: false
      },
      include: [
        {
          model: User,
          attributes: ['id', 'email']
        },
        {
          model: Email,
          attributes: ['id', 'subject']
        }
      ]
    });

    // Process each todo
    for (const todo of upcomingTodos) {
      try {
        // Here you would implement the actual reminder sending logic
        // For now, we'll just log it
        console.log(`Reminder for todo: ${todo.task}`);
        console.log(`Due: ${todo.deadline}`);
        console.log(`User: ${todo.User?.email}`);
        console.log(`Related to email: ${todo.Email?.subject}`);

        // Mark as reminded
        await todo.update({ reminded: true });
      } catch (error) {
        console.error(`Error processing reminder for todo ${todo.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in checkAndSendReminders:', error);
  }
}

// Start the reminder service
function startReminderService() {
  // Check for reminders every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running reminder check...');
    await checkAndSendReminders();
  });

  console.log('Reminder service started');
}

module.exports = {
  startReminderService,
  checkAndSendReminders
}; 