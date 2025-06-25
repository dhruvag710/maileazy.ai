const express = require('express');
const createError = require('http-errors');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const { sequelize, initializeDatabase } = require('./config/database');
const emailClassifierRoutes = require('./routes/emailClassifier');
const emailRoutes = require('./routes/emailRoutes');
const todoRoutes = require('./routes/todoRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const { startReminderService } = require('./services/reminderService');
const Email = require('./models/Email');
const User = require('./models/User');
const internshipRoutes = require('./routes/internshipRoutes');
const authRoutes = require('./routes/authRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

// Import models
require('./models/index');

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // CORS preflight cache for 24 hours
}));

// Increase payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(morgan('dev'));

// Initialize database and sync models
const setupDatabase = async () => {
  try {
    console.log('Starting database initialization...');
    
    // Check environment variables
    console.log('Environment check:', {
      DB_NAME: process.env.DB_NAME ? 'Set' : 'Not set',
      DB_USER: process.env.DB_USER ? 'Set' : 'Not set',
      DB_PASSWORD: process.env.DB_PASSWORD ? 'Set' : 'Not set',
      DB_HOST: process.env.DB_HOST ? 'Set' : 'Not set'
    });

    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('Failed to initialize database');
      process.exit(1); // Exit if database initialization fails
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno
    });
    process.exit(1); // Exit if there's an error
  }
};

// Routes
app.get('/', async (req, res, next) => {
  res.send({ message: 'Awesome it works 🐻' });
});

app.use('/api', require('./routes/api.route'));
app.use('/api', emailClassifierRoutes);
app.use('/api', emailRoutes);
app.use('/api', todoRoutes);
app.use('/api', reminderRoutes);
app.use('/api/internship', internshipRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/calendar', calendarRoutes);

// Start the reminder service
startReminderService();

app.use((req, res, next) => {
  next(createError.NotFound('Route not found'));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

// Start the server only after database is initialized
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await setupDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
