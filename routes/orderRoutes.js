const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');
const orderController = require('../controllers/orderController');

// Protect all /orders routes
router.use('/orders', authMiddleware.protect);

router.get('/orders', catchAsync(orderController.getAllOrders));
router.post('/orders', catchAsync(orderController.createOrder));
router.get('/orders/:id', catchAsync(orderController.getOrder));
router.put('/orders/:id/pay', catchAsync(orderController.updateOrderToPaid));

// Subscription is handled inside OrderController
router.post('/orders/subscriptions/weekly', catchAsync(orderController.createWeeklySubscription));

module.exports = router;