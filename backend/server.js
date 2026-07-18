require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');
const Stat = require('./models/Stat');

// Connect to Database
connectDB();

const app = express();

// Passport config
require('./config/passport')(passport);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'secret',
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'freshfromfarmssecret_key_2026');
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

// Stat tracking middleware (Visits)
app.use(async (req, res, next) => {
  // Only track API visits to avoid counting static asset requests if any
  if (req.path.startsWith('/api') && !req.path.startsWith('/api/admin')) {
    try {
      const today = new Date().toISOString().split('T')[0];
      await Stat.findOneAndUpdate(
        { date: today },
        { $inc: { visits: 1 } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    } catch (error) {
      console.error('Stat tracking error:', error);
    }
  }
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/product'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payment', require('./routes/payment'));

app.get('/test-email', async (req, res) => {
  try {
    const emailService = require('./services/emailService');
    await emailService.sendSignupEmail(
      process.env.SMTP_USER || 'test@example.com',
      'Test User'
    );
    res.send('Test email triggered! Check Render logs for results.');
  } catch (err) {
    res.status(500).send(`Email test failed: ${err.message}`);
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
