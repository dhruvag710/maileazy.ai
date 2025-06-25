const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

// Create OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000'
);

/**
 * Get a configured Google API client using the provided access token
 * @param {string} accessToken - The user's access token
 * @returns {OAuth2Client} - Configured Google API client
 */
async function getGoogleClient(accessToken) {
  try {
    // Create a new OAuth2 client instance
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000'
    );

    // Set credentials
    client.setCredentials({
      access_token: accessToken
    });

    return client;
  } catch (error) {
    console.error('Error creating Google client:', error);
    throw new Error('Failed to initialize Google client');
  }
}

/**
 * Refresh an expired access token using the refresh token
 * @param {string} refreshToken - The user's refresh token
 * @returns {Promise<string>} - New access token
 */
async function refreshAccessToken(refreshToken) {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
}

module.exports = {
  getGoogleClient,
  refreshAccessToken
}; 