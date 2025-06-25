import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Todo.css';
import NotificationIcon from './NotificationIcon';

const Todo = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sortBy, setSortBy] = useState('none');
  const [newTodo, setNewTodo] = useState({
    task: '',
    priority: 'medium',
    deadline: ''
  });

  // Sort todos based on priority
  const sortTodos = (todosToSort) => {
    if (sortBy === 'none') return todosToSort;
    
    const priorityOrder = {
      high: 3,
      medium: 2,
      low: 1
    };

    return [...todosToSort].sort((a, b) => {
      if (sortBy === 'priority-high') {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else if (sortBy === 'priority-low') {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return 0;
    });
  };

  // Apply sorting when todos or sortBy changes
  useEffect(() => {
    if (todos.length > 0) {
      const sortedTodos = sortTodos(todos);
      if (JSON.stringify(sortedTodos) !== JSON.stringify(todos)) {
        setTodos(sortedTodos);
      }
    }
  }, [sortBy]);

  useEffect(() => {
    fetchTodos();
    setupReminderPolling();
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const setupReminderPolling = () => {
    // Initial check
    checkReminders();

    // Poll every minute
    const interval = setInterval(checkReminders, 60 * 1000);
    return () => clearInterval(interval);
  };

  const checkReminders = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await axios.get(`http://localhost:4000/api/reminders/${userId}`);
      const reminders = response.data;

      reminders.forEach(todo => {
        showReminderNotification(todo);
      });
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  };

  const showReminderNotification = async (todo) => {
    const message = todo.deadline
      ? `⏰ Reminder: You have a pending task - '${todo.task}' (due ${formatDate(todo.deadline)})`
      : `⏰ Reminder: You have a pending task - '${todo.task}'`;

    // Show toast notification
    toast(
      <div>
        {message}
        <button 
          onClick={() => markReminderAsSeen(todo.id)}
          className="toast-button"
        >
          Mark as Seen
        </button>
      </div>,
      {
        position: "top-right",
        autoClose: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true
      }
    );

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Smart Mail AI Reminder', {
          body: message,
          icon: '/favicon.ico'
        });
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }
  };

  const markReminderAsSeen = async (taskId) => {
    try {
      await axios.post('http://localhost:4000/api/reminders/seen', { taskId });
      toast.dismiss();
    } catch (error) {
      console.error('Error marking reminder as seen:', error);
    }
  };

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem('userId');
      
      console.log('=== Fetching Todos ===');
      console.log('User ID from localStorage:', userId);
      
      if (!userId) {
        console.error('No user ID found in localStorage');
        setError('User not logged in. Please log in to view todos.');
        return;
      }

      console.log('Making API request to:', `http://localhost:4000/api/todos/${userId}`);
      const response = await axios.get(`http://localhost:4000/api/todos/${userId}`);
      
      console.log('API Response:', response);
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      console.log('Setting todos:', response.data);
      const sortedTodos = sortTodos(response.data);
      setTodos(sortedTodos);
    } catch (error) {
      console.error('Error fetching todos:', error);
      if (error.response) {
        // Server responded with an error
        console.error('Server error:', error.response.data);
        setError(error.response.data.error || 'Failed to load todos. Please try again later.');
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network error:', error.request);
        setError('Could not connect to server. Please check your internet connection.');
      } else {
        // Something else went wrong
        console.error('Other error:', error.message);
        setError('Failed to load todos. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTodoComplete = async (todoId, completed) => {
    try {
      console.log('=== Updating Todo ===');
      console.log('Todo ID:', todoId);
      console.log('Current completed status:', completed);
      
      const response = await axios.patch(`http://localhost:4000/api/todos/${todoId}`, {
        completed: !completed
      });
      
      console.log('Update response:', response);
      if (response.data) {
        console.log('Updating todo in state');
        setTodos(todos.map(todo => 
          todo.id === todoId ? { ...todo, completed: !completed } : todo
        ));
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('Failed to update todo. Please try again.');
    }
  };

  const deleteTodo = async (todoId) => {
    try {
      console.log('=== Deleting Todo ===');
      console.log('Todo ID:', todoId);
      
      await axios.delete(`http://localhost:4000/api/todos/${todoId}`);
      console.log('Todo deleted successfully');
      
      setTodos(todos.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Failed to delete todo. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('Please log in to create todos');
        return;
      }

      const response = await axios.post('http://localhost:4000/api/todos', {
        user_id: userId,
        ...newTodo
      });

      setTodos([response.data, ...todos]);
      setShowCreateForm(false);
      setNewTodo({
        task: '',
        priority: 'medium',
        deadline: ''
      });
      toast.success('Todo created successfully!');
    } catch (error) {
      console.error('Error creating todo:', error);
      toast.error('Failed to create todo. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="todo-loading">
        <div className="loading-spinner"></div>
        <p>Loading todos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="todo-error">
        <span className="material-icons">error_outline</span>
        <p>{error}</p>
        <button onClick={fetchTodos} className="retry-button">
          <span className="material-icons">refresh</span>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="todo-container">
      <ToastContainer />
      <div className="todo-header">
        <div className="header-left">
          <h2>Todo List</h2>
        </div>
        <div className="header-right">
          <div className="sort-dropdown">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort by priority"
            >
              <option value="none">Sort by Priority</option>
              <option value="priority-high">High to Low</option>
              <option value="priority-low">Low to High</option>
            </select>
          </div>
          <button
            className="create-todo-button"
            onClick={() => setShowCreateForm(true)}
          >
            Create Todo
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="create-todo-overlay">
          <div className="create-todo-modal">
            <div className="modal-header">
              <h2>Create New Todo</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateTodo} className="create-todo-form">
              <div className="form-group">
                <label htmlFor="task">Task</label>
                <input
                  type="text"
                  id="task"
                  value={newTodo.task}
                  onChange={(e) => setNewTodo({ ...newTodo, task: e.target.value })}
                  placeholder="Enter task description"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  value={newTodo.priority}
                  onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                  required
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="deadline">Deadline (optional)</label>
                <input
                  type="datetime-local"
                  id="deadline"
                  value={newTodo.deadline}
                  onChange={(e) => setNewTodo({ ...newTodo, deadline: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Todo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {todos.length === 0 ? (
        <div className="no-todos">
          <span className="material-icons">check_circle</span>
          <p>No todos found. They will appear here when extracted from your emails.</p>
        </div>
      ) : (
        <div className="todo-list">
          {todos.map(todo => (
            <div 
              key={todo.id} 
              className={`todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}`}
            >
              <div className="todo-checkbox">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodoComplete(todo.id, todo.completed)}
                />
              </div>
              <div className="todo-content">
                <div className="todo-task">{todo.task}</div>
                <div className="todo-meta">
                  <span className={`todo-priority priority-${todo.priority}`}>
                    {todo.priority}
                  </span>
                  {todo.deadline && (
                    <span className="todo-deadline">
                      <span className="material-icons">event</span>
                      {formatDate(todo.deadline)}
                    </span>
                  )}
                </div>
              </div>
              <button 
                className="todo-delete" 
                onClick={() => deleteTodo(todo.id)}
              >
                <span className="material-icons">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Todo; 