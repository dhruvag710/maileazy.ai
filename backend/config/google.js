const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/tasks'
];

const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
};

const GMAIL_LABELS = {
  IMPORTANT_MEETINGS: 'Important Meetings',
  DEADLINES: 'Deadlines',
  FOLLOW_UPS: 'Follow Ups',
  // Add more default labels as needed
};

module.exports = {
  SCOPES,
  GOOGLE_CONFIG,
  GMAIL_LABELS
}; 