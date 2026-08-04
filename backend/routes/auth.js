const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authRateLimiter, publicRateLimiter, authedRateLimiter } = require('../middleware/rateLimiter');

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() || req.user) return next();
  res.status(401).json({ message: 'Please login to continue' });
};

// OAuth & Session routes
router.get('/google', authRateLimiter, authController.googleLogin);
router.get('/google/callback', authController.googleCallback);
router.get('/logout', authController.logout);
router.get('/current_user', authedRateLimiter, authController.getCurrentUser);
router.get('/my-orders', isAuthenticated, authedRateLimiter, authController.getMyOrders);

// Stricter Auth routes (per-IP + per-account exponential backoff)
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/verify-email', authRateLimiter, authController.verifyEmail);
router.post('/resend-code', authRateLimiter, authController.resendVerificationCode);

// Moderate Public routes
router.post('/newsletter', publicRateLimiter, authController.subscribeNewsletter);
router.post('/contact', publicRateLimiter, authController.submitContactForm);
router.post('/chat', publicRateLimiter, authController.chatWithAssistant);
router.post('/track-guest-order', publicRateLimiter, authController.trackGuestOrder);

module.exports = router;
