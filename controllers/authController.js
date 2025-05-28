// authController.js - Combined best of both
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  
  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, phone } = req.body;
  
  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  const newUser = await User.create({
    name,
    email,
    phone,
    password,
    passwordConfirm,
    role: req.body.role || 'creator' // Default to creator
  });

  // Generate verification token
  const verificationToken = newUser.createEmailVerificationToken();
  await newUser.save({ validateBeforeSave: false });

  // Send welcome email
  const verificationURL = `${req.protocol}://${req.get('host')}/verify-email/${verificationToken}`;
  
  try {
    await sendEmail({
      email: newUser.email,
      subject: 'Welcome to FoF Recipes! Please verify your email',
      html: `Hi ${newUser.name},<br><br>
             Welcome to FoF Recipes!<br>
             Please verify your email by clicking this link:<br>
             <a href="${verificationURL}">Verify Email</a><br><br>
             The link will expire in 24 hours.`
    });
  } catch (err) {
    newUser.emailVerificationToken = undefined;
    newUser.emailVerificationExpires = undefined;
    await newUser.save({ validateBeforeSave: false });
    
    return next(new AppError('Error sending verification email. Please try again later.', 500));
  }

  createSendToken(newUser, 201, req, res);
});

exports.getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: req.user
  });
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3) If everything ok, send token to client
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};