const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const { User, Profile, DailyGoal, FoodItem, ConsumptionLog } = require('./models/relations');

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dailyGoalRoutes = require('./routes/dailyGoalRoutes');
const foodItemRoutes = require('./routes/foodItemRoutes');
const consumptionLogRoutes = require('./routes/consumptionLogRoutes');
const publicRoutes = require('./routes/publicRoutes');
const barcodeRoutes = require('./routes/barcodeRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const geminiRoutes = require('./routes/gemini');

dotenv.config();

const app = express();

// Performance Middleware
app.use(compression()); // Enable gzip compression

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit auth attempts
  message: 'Too many authentication attempts, please try again later.',
});

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://moonlit-kulfi-8c4807.netlify.app', // Production frontend
        process.env.FRONTEND_URL // Allow custom frontend URL
      ].filter(Boolean)
    : [
        'http://localhost:3000', // Local development
        'https://moonlit-kulfi-8c4807.netlify.app', // Production frontend
        'http://moonlit-kulfi-8c4807.netlify.app' // In case HTTP is used
      ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(helmet()); 
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Caching middleware for different endpoint types
const setCacheHeaders = (maxAge) => (req, res, next) => {
  res.set('Cache-Control', `public, max-age=${maxAge}`);
  res.set('ETag', `"${Date.now()}"`);
  next();
};

// Test database connection and sync models
sequelize.authenticate()
  .then(() => {
    // Sync all models without dropping existing data
    return sequelize.sync({ force: false }); // Use alter instead of force
  })
  .then(() => {
    // Database ready
  })
  .catch(err => {
    console.error('Database sync error:', err);
  });

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to NutriScan API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      profile: '/api/profile',
      goals: '/api/goals',
      food: '/api/food',
      logs: '/api/logs',
      recommendations: '/api/recommendations',
      barcode: '/api/barcode',
      gemini: '/api/gemini'
    }
  });
});


// Register API routes with appropriate caching and rate limiting
app.use('/api/barcode', setCacheHeaders(3600), barcodeRoutes); // 1 hour cache for barcode data
app.use('/api/public', setCacheHeaders(1800), publicRoutes); // 30 min cache for public data
app.use('/api/gemini', geminiRoutes); // No cache for AI responses
app.use('/api/auth', authLimiter, authRoutes); // Stricter rate limiting for auth
app.use('/api/profile', profileRoutes);
app.use('/api/goals', dailyGoalRoutes);
app.use('/api/food', setCacheHeaders(3600), foodItemRoutes); // 1 hour cache for food data
app.use('/api/logs', consumptionLogRoutes);
app.use('/api/recommendations', setCacheHeaders(600), recommendationRoutes); // 10 min cache for recommendations

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    sequelize.close().then(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    sequelize.close().then(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  });
}); 