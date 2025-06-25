const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// Get all todos for a user
router.get('/todos/:userId', async (req, res) => {
  try {
    console.log('\n=== Todo Fetch Request ===');
    console.log('User ID:', req.params.userId);
    
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      console.error('Invalid user ID:', req.params.userId);
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    console.log('Fetching todos for user:', userId);
    const todos = await Todo.findAll({
      where: {
        user_id: userId
      },
      order: [
        ['priority', 'DESC'],
        ['deadline', 'ASC'],
        ['created_at', 'DESC']
      ]
    });
    
    console.log('Found todos:', todos.length);
    console.log('Todo sample:', todos[0]);
    
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Mark todo as completed
router.patch('/todos/:id', async (req, res) => {
  try {
    console.log('\n=== Todo Update Request ===');
    console.log('Todo ID:', req.params.id);
    console.log('Update data:', req.body);
    
    const todoId = parseInt(req.params.id);
    if (isNaN(todoId)) {
      console.error('Invalid todo ID:', req.params.id);
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    const todo = await Todo.findByPk(todoId);
    if (!todo) {
      console.error('Todo not found:', todoId);
      return res.status(404).json({ error: 'Todo not found' });
    }

    todo.completed = req.body.completed;
    await todo.save();
    console.log('Todo updated successfully:', todo);
    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete a todo
router.delete('/todos/:id', async (req, res) => {
  try {
    console.log('\n=== Todo Delete Request ===');
    console.log('Todo ID:', req.params.id);
    
    const todoId = parseInt(req.params.id);
    if (isNaN(todoId)) {
      console.error('Invalid todo ID:', req.params.id);
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    const todo = await Todo.findByPk(todoId);
    if (!todo) {
      console.error('Todo not found:', todoId);
      return res.status(404).json({ error: 'Todo not found' });
    }

    await todo.destroy();
    console.log('Todo deleted successfully');
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Create a new todo manually
router.post('/todos', async (req, res) => {
  try {
    console.log('\n=== Manual Todo Creation Request ===');
    console.log('Request body:', req.body);
    
    const { user_id, task, priority, deadline } = req.body;
    
    if (!user_id || !task || !priority) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const todo = await Todo.create({
      user_id,
      task,
      priority: priority.toLowerCase(),
      deadline: deadline ? new Date(deadline) : null,
      completed: false,
      reminded: false
    });

    console.log('Todo created successfully:', todo);
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

module.exports = router; 