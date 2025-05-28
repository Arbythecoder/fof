const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError'); // Added to handle errors in restrictTo

exports.protect = async (req, res, next) => {
  let token;

  // Get token from header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return res.status(401).json({ message: 'Not logged in' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return res.status(401).json({ message: 'User no longer exists' });

  req.user = currentUser;
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission', 403));
    }
    next();
  };
};
