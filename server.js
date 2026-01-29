const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dataStore = require('./utils/dataStore');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for development
}));

// CORS configuration
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.CLIENT_URL) {
  throw new Error('CLIENT_URL must be configured in production environment for CORS.');
}

const corsOptions = {
  origin: isProduction
    ? process.env.CLIENT_URL
    : (process.env.CLIENT_URL || '*'),
  credentials: true
};

app.use(cors(corsOptions));

// Stripe webhook route must be mounted BEFORE body parser
// because Stripe requires raw body for signature verification
const stripeRoutes = require('./routes/stripe');
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeRoutes);

// Body parsing middleware (applied after webhook route)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// API Routes - Mount BEFORE static files to ensure API routes take precedence
const authRoutes = require('./routes/auth');
const downloadRoutes = require('./routes/download');
// stripeRoutes already loaded above for webhook
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/stripe', stripeRoutes); // Other Stripe routes
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'EzClippin API'
  });
});

// Analytics middleware to track visits
app.use((req, res, next) => {
  // Track non-API requests (website visits)
  if (!req.path.startsWith('/api/') && !req.path.includes('.')) {
    dataStore.trackVisit({
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      path: req.path,
      referrer: req.get('referrer') || 'direct'
    });
  }
  next();
});

// Serve static files - Mount AFTER API routes
app.use(express.static('.', {
  index: 'index.html'
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.status(404).sendFile(__dirname + '/index.html');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EzClippin server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'not configured'}`);
});

module.exports = app;
