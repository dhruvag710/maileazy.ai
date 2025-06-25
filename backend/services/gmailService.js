const { google } = require('googleapis');
const googleAuthService = require('./googleAuthService');
const { GMAIL_LABELS } = require('../config/google');

class GmailService {
  constructor() {
    this.gmail = null;
  }

  async initialize(userId) {
    const auth = await googleAuthService.getValidClient(userId);
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async createLabel(userId, labelName) {
    try {
      await this.initialize(userId);
      const response = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: labelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating label:', error);
      throw error;
    }
  }

  async setupDefaultLabels(userId) {
    try {
      for (const label of Object.values(GMAIL_LABELS)) {
        try {
          await this.createLabel(userId, label);
        } catch (error) {
          // Skip if label already exists
          if (error.code !== 409) throw error;
        }
      }
    } catch (error) {
      console.error('Error setting up default labels:', error);
      throw error;
    }
  }

  async applyLabel(userId, messageId, labelName) {
    try {
      await this.initialize(userId);
      const labels = await this.gmail.users.labels.list({ userId: 'me' });
      const label = labels.data.labels.find(l => l.name === labelName);
      
      if (!label) throw new Error(`Label ${labelName} not found`);

      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [label.id]
        }
      });
    } catch (error) {
      console.error('Error applying label:', error);
      throw error;
    }
  }

  async watchMailbox(userId) {
    try {
      await this.initialize(userId);
      const response = await this.gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: process.env.GMAIL_NOTIFICATION_TOPIC,
          labelIds: ['INBOX']
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error watching mailbox:', error);
      throw error;
    }
  }

  async getNewMessages(userId, historyId) {
    try {
      await this.initialize(userId);
      const response = await this.gmail.users.history.list({
        userId: 'me',
        startHistoryId: historyId
      });
      return response.data.history || [];
    } catch (error) {
      console.error('Error getting new messages:', error);
      throw error;
    }
  }
}

module.exports = new GmailService(); 