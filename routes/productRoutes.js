const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected admin routes
router.use(authMiddleware.protect, authMiddleware.restrictTo('admin'));

router.post('/', 
  productController.uploadProductImages,
  productController.resizeProductImages,
  productController.createProduct,
  productController.getAllProducts,
  productController.getProductById,
  productController.updateProduct,
  productController.deleteProduct
);

router.patch('/:id',
  productController.uploadProductImages,
  productController.resizeProductImages,
  productController.updateProduct
);

router.delete('/:id', productController.deleteProduct);

module.exports = router;