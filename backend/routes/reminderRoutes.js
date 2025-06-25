const express = require('express');
const router = express.Router();
const { checkAndSendReminders } = require('../services/reminderService');
const Todo = require('../models/Todo');

// Get all reminders for a user
router.get('/reminders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const reminders = await Todo.findAll({
      where: {
        user_id: userId,
        completed: false
      },
      order: [['deadline', 'ASC']]
    });

    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Manually trigger reminder check (for testing)
router.post('/check-reminders', async (req, res) => {
  try {
    await checkAndSendReminders();
    res.json({ message: 'Reminder check completed' });
  } catch (error) {
    console.error('Error checking reminders:', error);
    res.status(500).json({ error: 'Failed to check reminders' });
  }
});

// Mark a reminder as completed
router.put('/reminders/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    const reminder = await Todo.findByPk(id);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    await reminder.update({ completed: true });
    res.json(reminder);
  } catch (error) {
    console.error('Error completing reminder:', error);
    res.status(500).json({ error: 'Failed to complete reminder' });
  }
});

module.exports = router; 