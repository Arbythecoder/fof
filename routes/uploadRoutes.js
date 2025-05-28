const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');
const upload = require('../utils/multerConfig');

router.use(authMiddleware.protect);

// Image upload endpoints
router.post('/event', upload.single('image'), catchAsync(uploadController.uploadEventImage));
router.post('/product', upload.array('images', 5), catchAsync(uploadController.uploadProductImages));
router.post('/recipe', upload.single('preview'), catchAsync(uploadController.uploadRecipePreview));

module.exports = router;