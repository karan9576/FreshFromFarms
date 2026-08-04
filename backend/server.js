require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');
const Stat = require('./models/Stat');

// Ensure essential environment variables exist
const JWT_SECRET = process.env.JWT_SECRET || 'freshfromfarms_jwt_secret_secure_key_2026';
const SESSION_SECRET = process.env.SESSION_SECRET || 'freshfromfarms_session_secret_secure_key_2026';

// Connect to Database
connectDB();

const app = express();

// Passport config
require('./config/passport')(passport);

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express session
const sessionConfig = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy (Render)
  sessionConfig.cookie.secure = true;
  sessionConfig.cookie.sameSite = 'none';
}

app.use(session(sessionConfig));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// JWT verification middleware for cross-domain mobile API requests
app.use(async (req, res, next) => {
  if (req.user) return next(); // Already authenticated via session cookie

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, JWT_SECRET);
      const User = require('./models/User');
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      console.warn('[Auth] JWT token invalid or expired:', err.message);
    }
  }
  next();
});

// Throttling unique IP visits within a 1-hour window to keep hits accurate
const recentVisitors = new Map();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, time] of recentVisitors.entries()) {
    if (now - time > 1000 * 60 * 60) {
      recentVisitors.delete(ip);
    }
  }
}, 1000 * 60 * 15);

// Stat tracking middleware (Visits)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && !req.path.startsWith('/api/admin')) {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const now = Date.now();
    const lastVisit = recentVisitors.get(clientIp);

    if (!lastVisit || (now - lastVisit > 1000 * 60 * 60)) {
      recentVisitors.set(clientIp, now);
      try {
        const today = new Date().toISOString().split('T')[0];
        await Stat.findOneAndUpdate(
          { date: today },
          { $inc: { visits: 1 } },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      } catch (error) {
        console.error('Stat tracking error:', error.message);
      }
    }
  }
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/product'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payment', require('./routes/payment'));

app.get('/test-email', async (req, res, next) => {
  try {
    const emailService = require('./services/emailService');
    await emailService.sendSignupEmail(
      process.env.SMTP_USER || 'test@example.com',
      'Test User'
    );
    res.send('Test email triggered! Check logs for results.');
  } catch (err) {
    console.error('Email test failure:', err);
    res.status(500).json({ message: 'Email dispatch test failed.' });
  }
});

app.get('/diag', (req, res) => {
  res.json({
    FRONTEND_URL: process.env.FRONTEND_URL,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    JWT_SECRET_DEFINED: !!process.env.JWT_SECRET
  });
});

app.get('/', (req, res) => {
  res.send('FreshFromFarms API is running');
});

// Global Error Masking Middleware — Prevents stack traces, internal paths, and DB errors from reaching HTTP clients
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR HANDLER]', err.stack || err);
  
  // Return generic error message to HTTP clients
  res.status(err.status || 500).json({
    message: 'An unexpected internal server error occurred. Please try again later.'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
