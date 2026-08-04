const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { publicRateLimiter } = require('../middleware/rateLimiter');

router.get('/', publicRateLimiter, productController.getProducts);
router.get('/:id', publicRateLimiter, productController.getProductById);

module.exports = router;
