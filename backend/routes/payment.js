const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authedRateLimiter } = require('../middleware/rateLimiter');
const { validateCreateOrder, validateVerifyPayment } = require('../middleware/inputValidator');

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() || req.user) return next();
  res.status(401).json({ message: 'Please login to continue' });
};

router.post('/order', authedRateLimiter, validateCreateOrder, paymentController.createOrder);
router.post('/verify', authedRateLimiter, validateVerifyPayment, paymentController.verifyPayment);
router.post('/cod', authedRateLimiter, paymentController.createCodOrder);

module.exports = router;
