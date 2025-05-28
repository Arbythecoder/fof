const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');

router.post('/request', authMiddleware.protect, catchAsync(invoiceController.requestInvoice));
router.post('/callback', catchAsync(invoiceController.requestCallback));

module.exports = router;
