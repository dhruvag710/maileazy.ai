const Email = require('../models/Email');
const User = require('../models/User');
const Todo = require('../models/Todo');

const saveEmail = async (userId, emailData, classification) => {
  try {
    console.log('\n=== Attempting to save email ===');
    console.log(`Email ID: ${emailData.id}`);
    console.log(`User ID: ${userId}`);
    console.log(`Classification:`, classification);

    // Check if email already exists
    const existingEmail = await Email.findOne({
      where: { gmail_id: emailData.id }
    });

    if (existingEmail) {
      console.log('Email already exists in database');
      return { exists: true, email: existingEmail };
    }

    // Get email subject
    const emailSubject = emailData.payload.headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';

    // Create new email record
    const email = await Email.create({
      user_id: userId,
      gmail_id: emailData.id,
      subject: emailSubject,
      snippet: emailData.snippet,
      category: classification.category,
      priority: classification.priority.toLowerCase(),
      deadline: classification.deadline,
      fetched_at: new Date()
    });

    console.log('Email successfully saved to database');
    console.log(`Stored with ID: ${email.id}`);
    console.log(`Category: ${email.category}`);
    console.log(`Priority: ${email.priority}`);
    console.log(`Deadline: ${email.deadline || 'None'}`);

    // Create todos if present and priority is high or medium
    if (classification.todos && classification.priority.toLowerCase() !== 'low') {
      try {
        console.log('Creating todos from email:', classification.todos);
        for (const todo of classification.todos) {
          await Todo.create({
            user_id: userId,
            email_id: email.id,
            email_subject: emailSubject,
            task: todo.task,
            priority: todo.priority.toLowerCase(),
            deadline: todo.deadline ? new Date(todo.deadline) : null,
            completed: false
          });
        }
        console.log('Todos created successfully');
      } catch (error) {
        console.error('Error creating todos:', error);
        // Don't throw error here, continue with email save response
      }
    }

    return { exists: false, email };
  } catch (error) {
    console.error('Error saving email:', error);
    throw error;
  }
};

module.exports = {
  saveEmail
}; 