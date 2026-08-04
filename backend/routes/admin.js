const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authedRateLimiter } = require('../middleware/rateLimiter');
const {
  validateAddProduct,
  validateUpdateOrderStatus,
  validateParamObjectId
} = require('../middleware/inputValidator');

// Middleware to check if admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied, admin only' });
};

router.use(isAdmin);
router.use(authedRateLimiter);

router.get('/stats', adminController.getStats);
router.post('/products', validateAddProduct, adminController.addProduct);
router.delete('/products/:id', validateParamObjectId, adminController.deleteProduct);
router.get('/orders', adminController.getOrders);
router.put('/orders/:id/status', validateParamObjectId, validateUpdateOrderStatus, adminController.updateOrderStatus);

module.exports = router;
