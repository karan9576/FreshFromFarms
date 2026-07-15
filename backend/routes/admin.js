const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware to check if admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied, admin only' });
};

router.use(isAdmin);

router.get('/stats', adminController.getStats);
router.post('/products', adminController.addProduct);
router.delete('/products/:id', adminController.deleteProduct);
router.get('/orders', adminController.getOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

module.exports = router;
