const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000'
);

router.post('/google', async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token } = tokens;

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    oauth2Client.setCredentials(tokens);
    
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    const name = userInfo.data.name;

    // Find or create user in database
    let [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        name,
        access_token,
        refresh_token
      }
    });

    // Update tokens if user exists
    if (user) {
      await user.update({
        access_token,
        refresh_token: refresh_token || user.refresh_token // Keep old refresh token if new one isn't provided
      });
    }

    res.json({
      access_token,
      refresh_token,
      userId: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
});

module.exports = router; 