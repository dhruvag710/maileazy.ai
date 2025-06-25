const router = require('express').Router();
const axios = require('axios');
const qs = require('qs'); // npm install qs if not installed
require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('../models/User');

router.get('/', async (req, res, next) => {
  res.send({ message: 'Ok api is working 🚀' });
});

// Add a test route for database connection
router.get('/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'success',
      message: 'Database connection is working properly',
      dbName: process.env.DB_NAME || 'smart_mail'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

router.post('/auth/google', async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) return res.status(400).json({ message: 'Authorization code is required' });

    // Debug logging
    console.log('Environment variables check:');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
    console.log('REDIRECT_URI:', process.env.REDIRECT_URI ? 'Present' : 'Missing');

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      qs.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, id_token } = tokenResponse.data;

    // Get user info from Google
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { email, name } = userInfoResponse.data;

    // Create or update user in database
    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        name,
        access_token,
        refresh_token
      }
    });

    // If user exists, update their tokens
    if (!created) {
      user.access_token = access_token;
      user.refresh_token = refresh_token;
      await user.save();
    }

    // Send tokens and user info to frontend
    res.status(200).json({
      access_token,
      refresh_token,
      userId: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Auth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
});

// Get user profile
router.get('/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Get user info from Google
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const { email } = userInfoResponse.data;

    // Find user in database
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: userInfoResponse.data.picture
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
