const Invoice = require('../models/invoiceModel');
const Order = require('../models/orderModel');
const asyncHandler = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// @desc    Create invoice for an order
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = asyncHandler(async (req, res, next) => {
  const { orderId, dueDate } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return next(new AppError('Order not found', 404));

  const invoice = await Invoice.create({
    user: req.user._id,
    order: orderId,
    dueDate,
    amount: order.totalPrice,
    status: 'pending',
  });

  res.status(201).json({ status: 'success', data: invoice });
});

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private/Admin
exports.getAllInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find().populate('user order');
  res.status(200).json({ status: 'success', results: invoices.length, data: invoices });
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id).populate('order');
  if (!invoice) return next(new AppError('Invoice not found', 404));
  res.status(200).json({ status: 'success', data: invoice });
});
