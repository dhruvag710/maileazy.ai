const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { getGoogleClient } = require('../services/googleClient');

// Get calendar events for a date range
router.get('/events', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Get user's access token from request headers
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token provided' });
    }

    // Initialize Google Calendar API
    const auth = await getGoogleClient(accessToken);
    const calendar = google.calendar({ version: 'v3', auth });

    // Fetch calendar events
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      details: error.message 
    });
  }
});

// Create a new calendar event
router.post('/events', async (req, res) => {
  try {
    const { summary, description, start, end } = req.body;
    
    if (!summary || !start || !end) {
      return res.status(400).json({ error: 'Summary, start time, and end time are required' });
    }

    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token provided' });
    }

    const auth = await getGoogleClient(accessToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary,
      description,
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: 'UTC',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to create calendar event',
      details: error.message 
    });
  }
});

module.exports = router; 