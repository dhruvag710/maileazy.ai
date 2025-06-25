const { google } = require('googleapis');
const googleAuthService = require('./googleAuthService');

class TasksService {
  constructor() {
    this.tasks = null;
  }

  async initialize(userId) {
    const auth = await googleAuthService.getValidClient(userId);
    this.tasks = google.tasks({ version: 'v1', auth });
  }

  async createTaskList(userId, title) {
    try {
      await this.initialize(userId);
      const response = await this.tasks.tasklists.insert({
        requestBody: {
          title: title
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating task list:', error);
      throw error;
    }
  }

  async createTask(userId, taskListId, task) {
    try {
      await this.initialize(userId);
      const response = await this.tasks.tasks.insert({
        tasklist: taskListId,
        requestBody: {
          title: task.title,
          notes: task.notes,
          due: task.due ? new Date(task.due).toISOString() : undefined
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async createTaskFromEmail(userId, taskListId, email) {
    try {
      const task = {
        title: email.subject,
        notes: `Created from email: ${email.snippet}\n\nEmail ID: ${email.id}`,
        due: email.dueDate // If you have extracted a due date from email
      };
      return await this.createTask(userId, taskListId, task);
    } catch (error) {
      console.error('Error creating task from email:', error);
      throw error;
    }
  }

  async updateTask(userId, taskListId, taskId, updates) {
    try {
      await this.initialize(userId);
      const response = await this.tasks.tasks.patch({
        tasklist: taskListId,
        task: taskId,
        requestBody: updates
      });
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async listTasks(userId, taskListId) {
    try {
      await this.initialize(userId);
      const response = await this.tasks.tasks.list({
        tasklist: taskListId,
        showCompleted: true
      });
      return response.data.items || [];
    } catch (error) {
      console.error('Error listing tasks:', error);
      throw error;
    }
  }
}

module.exports = new TasksService(); 