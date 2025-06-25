const { OAuth2Client } = require('google-auth-library');
const { SCOPES, GOOGLE_CONFIG } = require('../config/google');
const User = require('../models/User');

class GoogleAuthService {
  constructor() {
    this.oAuth2Client = new OAuth2Client(
      GOOGLE_CONFIG.clientId,
      GOOGLE_CONFIG.clientSecret,
      GOOGLE_CONFIG.redirectUri
    );
  }

  getAuthUrl() {
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  async getTokens(code) {
    const { tokens } = await this.oAuth2Client.getToken(code);
    return tokens;
  }

  async setCredentials(tokens) {
    this.oAuth2Client.setCredentials(tokens);
    return this.oAuth2Client;
  }

  async refreshToken(refreshToken) {
    this.oAuth2Client.setCredentials({
      refresh_token: refreshToken
    });
    const { credentials } = await this.oAuth2Client.refreshAccessToken();
    return credentials;
  }

  async saveUserTokens(userId, tokens) {
    try {
      await User.update(
        {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(tokens.expiry_date)
        },
        {
          where: { id: userId }
        }
      );
    } catch (error) {
      console.error('Error saving user tokens:', error);
      throw error;
    }
  }

  async getValidClient(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      // Check if token needs refresh
      if (new Date() >= new Date(user.tokenExpiry)) {
        const newTokens = await this.refreshToken(user.refreshToken);
        await this.saveUserTokens(userId, newTokens);
        return this.setCredentials(newTokens);
      }

      return this.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
        expiry_date: user.tokenExpiry
      });
    } catch (error) {
      console.error('Error getting valid client:', error);
      throw error;
    }
  }
}

module.exports = new GoogleAuthService(); 