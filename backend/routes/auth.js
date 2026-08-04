const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authRateLimiter, publicRateLimiter, authedRateLimiter } = require('../middleware/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendCode,
  validateNewsletter,
  validateContact,
  validateChat,
  validateTrackGuestOrder
} = require('../middleware/inputValidator');

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

// Stricter Auth routes with input schema validation
router.post('/register', authRateLimiter, validateRegister, authController.register);
router.post('/login', authRateLimiter, validateLogin, authController.login);
router.post('/verify-email', authRateLimiter, validateVerifyEmail, authController.verifyEmail);
router.post('/resend-code', authRateLimiter, validateResendCode, authController.resendVerificationCode);

// Moderate Public routes with input schema validation
router.post('/newsletter', publicRateLimiter, validateNewsletter, authController.subscribeNewsletter);
router.post('/contact', publicRateLimiter, validateContact, authController.submitContactForm);
router.post('/chat', publicRateLimiter, validateChat, authController.chatWithAssistant);
router.post('/track-guest-order', publicRateLimiter, validateTrackGuestOrder, authController.trackGuestOrder);

module.exports = router;
