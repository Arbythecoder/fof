const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect: auth } = require('../middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');
const multer = require('multer');
const upload = multer(); // Or require your custom multer config

// All routes below require authentication
router.use(auth);

// User profile routes
router.get('/profile', catchAsync(userController.getUserProfile));
router.patch('/profile', catchAsync(userController.updateUserProfile));

// Favorites routes
router.get('/favorites', catchAsync(userController.getFavorites));
router.post('/favorites', catchAsync(userController.addToFavorites));

// User management routes
router.get('/', catchAsync(userController.getAllUsers));
router.get('/:id', catchAsync(userController.getUserById));
router.delete('/:id', catchAsync(userController.deleteUser));

// Profile image upload
router.post('/upload', upload.single('image'), userController.uploadProfileImage);

module.exports = router;
