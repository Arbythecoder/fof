const User = require('../models/userModel');
const asyncHandler = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ status: 'success', data: user });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) return next(new AppError('User not found', 404));

  user.name = name || user.name;
  user.email = email || user.email;
  if (password) user.password = password;

  await user.save();

  res.status(200).json({ status: 'success', message: 'Profile updated' });
});

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  res.status(200).json({ status: 'success', results: users.length, data: users });
});

// @desc    Get single user (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new AppError('User not found', 404));
  res.status(200).json({ status: 'success', data: user });
});

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  res.status(204).json({ status: 'success', message: 'User deleted' });
});

// @desc    Upload profile image
// @route   POST /api/users/profile/image
// @access  Private
exports.uploadProfileImage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (req.file) {
      user.image = req.file.path; // path where image is stored
      await user.save();
    }
    res.status(200).json({
      status: 'success',
      message: 'Profile image uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
};