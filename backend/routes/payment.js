const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Please login to continue' });
};

router.post('/order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);

module.exports = router;
