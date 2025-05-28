const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const contactRoutes = require('./routes/contactRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const recipeBuilderRoutes = require('./routes/recipeBuilderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Global Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(hpp());
app.use(mongoSanitize());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
});
app.use(limiter);

// Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/recipe-builder', recipeBuilderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/uploads', uploadRoutes);
// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Error Handler
app.use(errorHandler);

module.exports = app;
