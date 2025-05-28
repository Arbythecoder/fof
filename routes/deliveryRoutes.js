const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');

router.use(authMiddleware.protect);

// Delivery management
router.get('/schedule', catchAsync(deliveryController.getDeliverySchedule));
router.patch('/:id/reschedule', catchAsync(deliveryController.rescheduleDelivery));
router.get('/zones', catchAsync(deliveryController.getDeliveryZones));
router.get('/availability', catchAsync(deliveryController.checkAvailability));

module.exports = router;