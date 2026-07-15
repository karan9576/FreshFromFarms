const passport = require('passport');
const mongoose = require('mongoose');
const Order = require('../models/Order');

exports.googleLogin = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleCallback = passport.authenticate('google', {
  successRedirect: process.env.FRONTEND_URL,
  failureRedirect: `${process.env.FRONTEND_URL}/login`,
});

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
