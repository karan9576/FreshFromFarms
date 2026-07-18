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
      // If user exists but is not verified, allow them to overwrite registration with new code
      if (!existingUser.isVerified) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        existingUser.displayName = displayName.trim();
        existingUser.password = hashedPassword;
        
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.verificationCode = verificationCode;
        existingUser.verificationCodeExpires = new Date(Date.now() + 3600000);
        
        await existingUser.save();
        await emailService.sendVerificationEmail(existingUser.email, existingUser.displayName, verificationCode);
        
        return res.status(201).json({
          message: 'Verification code resent to your email. Please verify to complete registration.',
          email: existingUser.email,
          requiresVerification: true
        });
      }
      return res.status(400).json({ message: 'A user with this email address already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour expiration

    // Create the user (unverified by default)
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(emailNormalized);

    const newUser = new User({
      displayName: displayName.trim(),
      email: emailNormalized,
      password: hashedPassword,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
      isAdmin
    });

    await newUser.save();

    // Send verification email
    await emailService.sendVerificationEmail(newUser.email, newUser.displayName, verificationCode);

    res.status(201).json({
      message: 'Verification code sent to your email. Please verify to complete registration.',
      email: newUser.email,
      requiresVerification: true
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

    // Sync isAdmin state dynamically from environment configurations
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(user.email.toLowerCase());
    if (user.isAdmin !== isAdmin) {
      user.isAdmin = isAdmin;
      await user.save();
    }

    // Check if account is verified
    if (!user.isVerified) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = new Date(Date.now() + 3600000);
      await user.save();

      await emailService.sendVerificationEmail(user.email, user.displayName, verificationCode);

      return res.status(403).json({
        message: 'Your email address is not verified. A new code has been sent to your inbox.',
        email: user.email,
        requiresVerification: true
      });
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

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified. Please log in.' });
    }

    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Set verified and sync admin status
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(user.email.toLowerCase());
    
    user.isVerified = true;
    user.isAdmin = isAdmin;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Trigger welcome signup email asynchronously
    emailService.sendSignupEmail(user.email, user.displayName).catch(err => {
      console.error('Welcome email trigger failed:', err.message);
    });

    // Track signup stat
    try {
      const Stat = require('../models/Stat');
      const today = new Date().toISOString().split('T')[0];
      await Stat.findOneAndUpdate(
        { date: today },
        { $inc: { signups: 1 } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    } catch (statErr) {
      console.error('Stat update failed:', statErr.message);
    }

    // Generate JWT
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
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Error verifying code. Please try again.' });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified' });
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 3600000);
    await user.save();

    await emailService.sendVerificationEmail(user.email, user.displayName, verificationCode);

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ message: 'Error resending verification code. Please try again.' });
  }
};

exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Trigger welcome subscription email containing the 10% discount coupon
    await emailService.sendNewsletterSignupEmail(emailNormalized);

    res.json({ message: 'Thank you! You have successfully subscribed. Check your inbox for your 10% discount code!' });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ message: 'Error processing subscription. Please try again.' });
  }
};

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Trigger customer inquiry email notification to care.freshfromfarms@gmail.com
    await emailService.sendContactFormEmail(name.trim(), emailNormalized, phone ? phone.trim() : 'N/A', message.trim());

    res.json({ message: 'Thank you! Your message has been sent successfully. We will get back to you shortly.' });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ message: 'Error sending your message. Please try again.' });
  }
};
