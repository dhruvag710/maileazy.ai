const express = require('express');
const router = express.Router();
const axios = require('axios');
const { saveEmail } = require('../utils/emailUtils');
const Email = require('../models/Email');
const User = require('../models/User');

// Import the email classifier route handler instead of the module
const emailClassifierRouter = require('./emailClassifier');

// Function to classify email using our API
const classifyEmail = async (emailData) => {
  try {
    console.log('\n=== Starting Email Classification ===');
    console.log('Email:', {
      id: emailData.id,
      subject: emailData.payload.headers.find(h => h.name.toLowerCase() === 'subject')?.value,
      from: emailData.payload.headers.find(h => h.name.toLowerCase() === 'from')?.value,
      snippet_length: emailData.snippet?.length || 0
    });

    const response = await axios.post('http://localhost:4000/api/classify-email', {
      subject: emailData.payload.headers.find(h => h.name.toLowerCase() === 'subject')?.value || '',
      content: emailData.snippet || '',
      from: emailData.payload.headers.find(h => h.name.toLowerCase() === 'from')?.value || '',
      hasAttachments: emailData.payload.parts && emailData.payload.parts.some(part => part.filename)
    });
    
    console.log('Classification result:', response.data);
    return response.data; // Returns { category, priority, deadline }
  } catch (error) {
    console.error('Error classifying email:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return {
      category: 'Others',
      priority: 'low',
      deadline: null
    };
  }
};

router.get('/fetchEmails', async (req, res) => {
  try {
    console.log('\n=== Starting Email Fetch ===');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.error('No token provided in request headers');
      return res.status(401).json({ error: 'No access token provided' });
    }

    // Get user info
    console.log('Fetching user info with token:', token.substring(0, 10) + '...');
    let userInfoResponse;
    try {
      userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Google userinfo error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });
      if (error.response?.status === 401) {
        return res.status(401).json({ error: 'Invalid or expired access token' });
      }
      throw error;
    }
    
    // Find or create user
    console.log('Finding/creating user:', userInfoResponse.data.email);
    let user;
    try {
      [user] = await User.findOrCreate({
        where: { email: userInfoResponse.data.email },
        defaults: {
          name: userInfoResponse.data.name,
          access_token: token
        }
      });
    } catch (error) {
      console.error('Database error during user creation:', {
        error: error.message,
        stack: error.stack,
        code: error.code
      });
      throw error;
    }

    // Update token if it changed
    if (user.access_token !== token) {
      console.log('Updating user token...');
      try {
        await user.update({ access_token: token });
      } catch (error) {
        console.error('Error updating user token:', {
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    }

    // Fetch emails from Gmail API
    console.log('Fetching emails from Gmail API...');
    let listRes;
    try {
      listRes = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          maxResults: 20,
          q: 'in:inbox'
        }
      });
    } catch (error) {
      console.error('Gmail API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      if (error.response?.status === 401) {
        return res.status(401).json({ error: 'Gmail API access token expired' });
      }
      throw error;
    }

    if (!listRes.data.messages || listRes.data.messages.length === 0) {
      console.log('No emails found in inbox');
      return res.json({ emails: [] });
    }

    console.log(`Found ${listRes.data.messages.length} emails in inbox`);

    // Get stored email IDs to filter out already processed ones
    const storedEmails = await Email.findAll({
      where: { user_id: user.id },
      attributes: ['gmail_id', 'category', 'priority', 'deadline']
    });
    const storedEmailMap = new Map(storedEmails.map(e => [e.gmail_id, e]));
    
    // Filter out already processed emails
    const newEmails = listRes.data.messages.filter(email => !storedEmailMap.has(email.id));
    console.log(`Found ${newEmails.length} new emails to process`);

    // Fetch details only for new emails
    console.log('Fetching details for new emails...');
    const emailDetails = await Promise.all(
      newEmails.map(async (email) => {
        const response = await axios.get(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        return response.data;
      })
    );

    // Process and store new emails
    console.log('Processing and storing new emails...');
    const processedEmails = await Promise.all(
      emailDetails.map(async (emailData) => {
        // Classify email using our function
        const classification = await classifyEmail(emailData);
        
        // Save to database
        const { exists, email } = await saveEmail(user.id, emailData, classification);
        
        console.log('Processed email:', {
          id: emailData.id,
          category: classification.category,
          priority: classification.priority,
          deadline: classification.deadline,
          stored: !exists
        });

        return {
          ...emailData,
          category: classification.category,
          priority: classification.priority,
          deadline: classification.deadline,
          stored: !exists
        };
      })
    );

    // Fetch details for stored emails that are in the current inbox view
    const storedEmailDetails = await Promise.all(
      listRes.data.messages
        .filter(email => storedEmailMap.has(email.id))
        .map(async (email) => {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          // Get the stored classification for this email
          const storedEmail = storedEmailMap.get(email.id);
          return {
            ...response.data,
            category: storedEmail.category,
            priority: storedEmail.priority,
            deadline: storedEmail.deadline
          };
        })
    );

    // Combine new and stored emails
    const combinedEmails = [
      ...processedEmails,
      ...storedEmailDetails
    ];

    // Sort all emails by date
    const sortedEmails = combinedEmails.sort((a, b) => 
      parseInt(b.internalDate) - parseInt(a.internalDate)
    );

    console.log(`Sending ${sortedEmails.length} total emails to frontend`);

    // Get category and priority statistics
    const stats = {
      categories: {},
      priorities: { high: 0, medium: 0, low: 0 }
    };

    sortedEmails.forEach(email => {
      // Count categories
      stats.categories[email.category] = (stats.categories[email.category] || 0) + 1;
      // Count priorities
      stats.priorities[email.priority.toLowerCase()]++;
    });

    res.json({
      emails: sortedEmails,
      stats,
      totalStored: storedEmails.length
    });

  } catch (error) {
    console.error('Error in /fetchEmails:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
    // Send a more detailed error response
    res.status(500).json({ 
      error: 'Failed to fetch emails',
      details: error.message,
      status: error.response?.status || 500
    });
  }
});

module.exports = router; 