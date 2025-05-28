// In your adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware'); // <-- fixed path

// All admin routes require authentication and admin role
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

// GET /api/admin/users
router.get('/users', adminController.getAllUsers); // <-- make sure this function exists and is exported

module.exports = router;