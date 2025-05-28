const Order = require('../models/orderModel');
const Product = require('../models/productModel'); // Updated import path
const asyncHandler = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;
  if (!orderItems || orderItems.length === 0) {
    return next(new AppError('No order items', 400));
  }
  const newOrder = await Order.create({
    orderItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    totalPrice,
    isPaid: false,
    paidAt: null,
  });
  res.status(201).json({
    status: 'success',
    data: newOrder
  });
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.status(200).json({ status: 'success', data: orders });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return next(new AppError('Order not found', 404));
  // Users can only access their own orders unless admin
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized', 401));
  }
  res.status(200).json({ status: 'success', data: order });
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));
  order.isPaid = true;
  order.paidAt = Date.now();
  await order.save();
  res.status(200).json({ status: 'success', message: 'Order marked as paid' });
});

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email');
  res.status(200).json({ status: 'success', data: orders });
});

// --- Subscription Logic (merged into OrderController) ---

// @desc    Create weekly subscription and schedule first order
// @route   POST /api/orders/subscriptions/weekly
// @access  Private
exports.createWeeklySubscription = asyncHandler(async (req, res, next) => {
  const { products, deliveryDay, paymentMethod, shippingAddress, totalPrice } = req.body;
  
  // Build subscription details to embed within the order
  const subscriptionDetails = {
    frequency: 'weekly',
    deliveryDay,
    nextDeliveryDate: calculateNextDelivery(deliveryDay)
  };

  // Create the first order and embed subscription details
  const newOrder = await Order.create({
    orderItems: products, // expected to be an array of order items
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    totalPrice: totalPrice || 0,
    status: 'scheduled', // or another field; this indicates it's a subscription order
    subscriptionDetails // This field must exist in your Order schema
  });
  
  res.status(201).json({
    status: 'success',
    data: newOrder
  });
});

// Helper function to calculate the next delivery date based on a given day
function calculateNextDelivery(deliveryDay) {
  const today = new Date();
  const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
  const daysMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  const targetDay = daysMap[deliveryDay];
  let daysUntilDelivery = targetDay - currentDay;
  if (daysUntilDelivery <= 0) {
    daysUntilDelivery += 7; // schedule for next week
  }
  const nextDelivery = new Date();
  nextDelivery.setDate(today.getDate() + daysUntilDelivery);
  return nextDelivery;
}