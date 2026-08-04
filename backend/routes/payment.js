const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authedRateLimiter } = require('../middleware/rateLimiter');

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() || req.user) return next();
  res.status(401).json({ message: 'Please login to continue' });
};

router.post('/order', authedRateLimiter, paymentController.createOrder);
router.post('/verify', authedRateLimiter, paymentController.verifyPayment);

module.exports = router;
