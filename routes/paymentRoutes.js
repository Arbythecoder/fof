const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');

// Payment endpoints (protected routes)
router.use(authMiddleware.protect);

// Main payment processing
router.post('/process', catchAsync(paymentController.processPayment));

// Specific payment methods
router.post('/paypal/create-order', catchAsync(paymentController.createPayPalOrder));
router.post('/paypal/capture', catchAsync(paymentController.capturePayPalPayment));
router.post('/revolut', catchAsync(paymentController.processRevolutPayment));
router.post('/stripe', catchAsync(paymentController.processStripePayment));

// Webhooks
router.post('/webhook/paypal', express.raw({type: 'application/json'}), catchAsync(paymentController.payPalWebhook));
router.post('/webhook/revolut', express.raw({type: 'application/json'}), catchAsync(paymentController.revolutWebhook));
router.post('/webhook/stripe', express.raw({type: 'application/json'}), catchAsync(paymentController.stripeWebhook));

// Remove the auth login route (should be in authRoutes)
module.exports = router;