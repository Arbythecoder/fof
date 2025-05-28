const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const asyncHandler = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const APIFeatures = require('../utils/apiFeatures');
const upload = require('../utils/upload');

// @desc    Get all users with advanced filtering
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = (req, res) => {
  // your logic here
  res.json({ message: 'All users' });
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// @desc    Create user (admin only)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role: role || 'user'
  });

  // Send welcome email
  await sendEmail({
    email: newUser.email,
    subject: 'Your FoF Recipes account has been created',
    html: `<h1>Welcome to FoF Recipes!</h1>
           <p>Your admin account has been created successfully</p>
           <p>Email: ${email}</p>
           <p>Temporary Password: ${password}</p>
           <p>Please change your password after logging in.</p>`
  });

  newUser.password = undefined;

  res.status(201).json({
    status: 'success',
    data: { user: newUser }
  });
});

// @desc    Update user (admin only)
// @route   PATCH /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  // 1) Filter out unwanted fields
  const filteredBody = filterObj(req.body, 'name', 'email', 'role', 'active');

  // 2) Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Prevent deleting yourself or other admins
  if (user.role === 'admin') {
    return next(new AppError('Cannot delete admin users', 403));
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Helper function to filter object fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
// controllers/adminController.js
exports.getOrders = asyncHandler(async (req, res, next) => {
  const { status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
  
  const filter = {};
  if (status) filter.deliveryStatus = status;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }
  
  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);
    
  const count = await Order.countDocuments(filter);
  
  res.status(200).json({
    status: 'success',
    data: orders,
    pagination: {
      total: count,
      page: +page,
      pages: Math.ceil(count / limit)
    }
  });
});

exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, trackingNumber } = req.body;
  
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));
  
  order.deliveryStatus = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  
  await order.save();
  
  // Send status update notification
  sendOrderStatusUpdate(order.user, order);
  
  res.status(200).json({
    status: 'success',
    data: order
  });
});