const passport = require('passport');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const emailService = require('../services/emailService');

exports.googleLogin = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
      }
      
      // Generate JWT session token for cross-domain mobile clients
      const token = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET || 'freshfromfarmssecret_key_2026',
        { expiresIn: '30d' }
      );
      
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login-success?token=${token}`);
    });
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect(process.env.FRONTEND_URL);
  });
};

exports.getCurrentUser = (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving your orders' });
  }
};

exports.trackGuestOrder = async (req, res) => {
  try {
    const { orderId, email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required to track orders.' });
    }

    const emailRegex = new RegExp(`^${email.trim()}$`, 'i');

    // If orderId is provided, track that specific order
    if (orderId && orderId.trim()) {
      if (!mongoose.Types.ObjectId.isValid(orderId.trim())) {
        return res.status(400).json({ message: 'Invalid Order ID format. It must be a 24-character hex string.' });
      }

      const order = await Order.findOne({
        _id: orderId.trim(),
        email: emailRegex
      });

      if (!order) {
        return res.status(404).json({ message: 'No matching order found for this Order ID and email.' });
      }

      return res.json([order]); // Return as array for consistent frontend mapping
    }

    // If orderId is NOT provided, return all guest orders associated with this email
    const orders = await Order.find({ email: emailRegex }).sort({ createdAt: -1 });
    
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found associated with this email address.' });
    }

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error tracking orders' });
  }
};

exports.register = async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    if (!displayName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email address already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const newUser = new User({
      displayName: displayName.trim(),
      email: emailNormalized,
      password: hashedPassword
    });

    await newUser.save();

    // Trigger welcome signup email asynchronously
    emailService.sendSignupEmail(newUser.email, newUser.displayName).catch(err => {
      console.error('Welcome email trigger failed:', err.message);
    });

    // Sign JWT
    const token = jwt.sign(
      { id: newUser._id, isAdmin: newUser.isAdmin },
      process.env.JWT_SECRET || 'freshfromfarmssecret_key_2026',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        displayName: newUser.displayName,
        email: newUser.email,
        isAdmin: newUser.isAdmin
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering new user. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailNormalized = email.toLowerCase().trim();

    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if it is a Google-only account (no password set)
    if (!user.password) {
      return res.status(400).json({ message: 'This account is set up with Google Login. Please sign in with Google.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'freshfromfarmssecret_key_2026',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        picture: user.picture,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in. Please try again.' });
  }
};
