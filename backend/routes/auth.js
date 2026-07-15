const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Please login to continue' });
};

router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);
router.get('/logout', authController.logout);
router.get('/current_user', authController.getCurrentUser);
router.get('/my-orders', isAuthenticated, authController.getMyOrders);
router.post('/track-guest-order', authController.trackGuestOrder);

module.exports = router;
