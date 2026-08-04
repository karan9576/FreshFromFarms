const mongoose = require('mongoose');

// Helper regex patterns
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const NUMERIC_CODE_REGEX = /^\d{6}$/;
const PINCODE_REGEX = /^\d{6}$/;
const PHONE_REGEX = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]{7,15}$/;
const URL_OR_PATH_REGEX = /^(https?:\/\/[^\s/$.?#].[^\s]*|\/[a-zA-Z0-9_.-]+)$/i;

const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<script\b[^<]*>(?:[\s\S]*?)<\/script>/gi, '').replace(/<[^>]*>?/gm, '').trim();
};

const sendValidationError = (res, message) => {
  return res.status(400).json({ message });
};

// 1. Auth & Registration Schema Validators
exports.validateRegister = (req, res, next) => {
  const { displayName, email, password } = req.body || {};

  if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2 || displayName.trim().length > 70) {
    return sendValidationError(res, 'Display Name is required and must be between 2 and 70 characters.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 254) {
    return sendValidationError(res, 'A valid email address is required (max 254 characters).');
  }

  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return sendValidationError(res, 'Password is required and must be between 6 and 128 characters.');
  }

  req.body.displayName = sanitizeString(displayName);
  req.body.email = email.trim().toLowerCase();
  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 254) {
    return sendValidationError(res, 'A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 1 || password.length > 128) {
    return sendValidationError(res, 'Password is required.');
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

exports.validateVerifyEmail = (req, res, next) => {
  const { email, code } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return sendValidationError(res, 'A valid email address is required.');
  }

  if (!code || typeof code !== 'string' || !NUMERIC_CODE_REGEX.test(code.trim())) {
    return sendValidationError(res, 'Verification code must be a 6-digit numeric code.');
  }

  req.body.email = email.trim().toLowerCase();
  req.body.code = code.trim();
  next();
};

exports.validateResendCode = (req, res, next) => {
  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return sendValidationError(res, 'A valid email address is required.');
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

// 2. Public Form Validators
exports.validateNewsletter = (req, res, next) => {
  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return sendValidationError(res, 'A valid email address is required for newsletter subscription.');
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

exports.validateContact = (req, res, next) => {
  const { name, email, phone, message } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return sendValidationError(res, 'Name is required (2 to 100 characters).');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return sendValidationError(res, 'A valid email address is required.');
  }

  if (phone && typeof phone === 'string' && phone.trim().length > 0 && !PHONE_REGEX.test(phone.trim())) {
    return sendValidationError(res, 'Invalid phone number format.');
  }

  if (!message || typeof message !== 'string' || message.trim().length < 5 || message.trim().length > 2000) {
    return sendValidationError(res, 'Message is required (5 to 2000 characters).');
  }

  req.body.name = sanitizeString(name);
  req.body.email = email.trim().toLowerCase();
  if (phone) req.body.phone = sanitizeString(phone);
  req.body.message = sanitizeString(message);
  next();
};

exports.validateChat = (req, res, next) => {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length < 1 || message.trim().length > 2000) {
    return sendValidationError(res, 'Message text is required (1 to 2000 characters).');
  }

  req.body.message = sanitizeString(message);
  next();
};

exports.validateTrackGuestOrder = (req, res, next) => {
  const { email, orderId } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return sendValidationError(res, 'A valid email address is required to track orders.');
  }

  if (orderId && typeof orderId === 'string' && orderId.trim().length > 0 && !OBJECT_ID_REGEX.test(orderId.trim())) {
    return sendValidationError(res, 'Order ID must be a 24-character hexadecimal ObjectId.');
  }

  req.body.email = email.trim().toLowerCase();
  if (orderId) req.body.orderId = orderId.trim();
  next();
};

// 3. Admin & Product Schema Validators
exports.validateAddProduct = (req, res, next) => {
  const { name, price, description, flavour, imageUrl } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return sendValidationError(res, 'Product name is required (2 to 100 characters).');
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0 || parsedPrice > 1000000) {
    return sendValidationError(res, 'Product price must be a valid positive number.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 5 || description.trim().length > 2000) {
    return sendValidationError(res, 'Product description is required (5 to 2000 characters).');
  }

  if (imageUrl && (typeof imageUrl !== 'string' || !URL_OR_PATH_REGEX.test(imageUrl.trim()))) {
    return sendValidationError(res, 'Product Image URL must be a valid HTTP/HTTPS URL or relative media path.');
  }

  req.body.name = sanitizeString(name);
  req.body.price = parsedPrice;
  req.body.description = sanitizeString(description);
  if (flavour) req.body.flavour = sanitizeString(flavour);
  if (imageUrl) req.body.imageUrl = imageUrl.trim();
  next();
};

exports.validateUpdateOrderStatus = (req, res, next) => {
  const { status } = req.body || {};
  const allowedStatuses = ['Pending', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

  if (!status || typeof status !== 'string' || !allowedStatuses.includes(status.trim())) {
    return sendValidationError(res, `Order status must be one of: ${allowedStatuses.join(', ')}.`);
  }

  req.body.status = status.trim();
  next();
};

// 4. Payment & Order Schema Validators
exports.validateCreateOrder = (req, res, next) => {
  const { amount, address, pincode, phone } = req.body || {};

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return sendValidationError(res, 'Order amount must be a positive number.');
  }

  if (pincode && (typeof pincode !== 'string' || !PINCODE_REGEX.test(pincode.trim()))) {
    return sendValidationError(res, 'Pincode must be a 6-digit numeric string.');
  }

  if (phone && (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim()))) {
    return sendValidationError(res, 'Invalid phone number format.');
  }

  req.body.amount = parsedAmount;
  next();
};

exports.validateVerifyPayment = (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  if (!razorpay_order_id || typeof razorpay_order_id !== 'string' || !razorpay_order_id.trim()) {
    return sendValidationError(res, 'Razorpay Order ID is required.');
  }

  if (!razorpay_payment_id || typeof razorpay_payment_id !== 'string' || !razorpay_payment_id.trim()) {
    return sendValidationError(res, 'Razorpay Payment ID is required.');
  }

  if (!razorpay_signature || typeof razorpay_signature !== 'string' || !razorpay_signature.trim()) {
    return sendValidationError(res, 'Razorpay Signature is required.');
  }

  next();
};

// 5. Generic MongoDB ObjectId Route Parameter Validator
exports.validateParamObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !OBJECT_ID_REGEX.test(id.trim())) {
    return sendValidationError(res, 'Invalid ID format in request URL.');
  }
  next();
};
