const passport = require('passport');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');

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
    if (!orderId || !email) {
      return res.status(400).json({ message: 'Order ID and Email are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).json({ message: 'Order not found. Invalid ID format.' });
    }

    const order = await Order.findOne({
      _id: orderId,
      email: new RegExp(`^${email.trim()}$`, 'i') // Case-insensitive email comparison
    });

    if (!order) {
      return res.status(404).json({ message: 'No matching order found for this ID and email.' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error tracking order' });
  }
};
