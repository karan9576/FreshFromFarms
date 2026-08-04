const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { publicRateLimiter } = require('../middleware/rateLimiter');
const { validateParamObjectId } = require('../middleware/inputValidator');

router.get('/', publicRateLimiter, productController.getProducts);
router.get('/:id', publicRateLimiter, validateParamObjectId, productController.getProductById);

module.exports = router;
