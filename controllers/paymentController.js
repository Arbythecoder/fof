const axios = require('axios');
const Order = require('../models/orderModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// PayPal Implementation
exports.createPayPalOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const paypalOrder = {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'EUR', // Changed to EUR
        value: order.totalPrice.toFixed(2)
      },
      description: `FoF Order #${order._id}`
    }],
    application_context: {
      brand_name: 'Flavors of Freshness',
      user_action: 'PAY_NOW',
      return_url: `${process.env.CLIENT_URL}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`
    }
  };

  const { data } = await axios.post(
    `${process.env.PAYPAL_API_URL}/v2/checkout/orders`,
    paypalOrder,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getPayPalAccessToken()}`
      }
    }
  );

  res.status(200).json(data);
});

exports.capturePayPalPayment = catchAsync(async (req, res, next) => {
  const { orderID } = req.body;
  
  const { data } = await axios.post(
    `${process.env.PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getPayPalAccessToken()}`
      }
    }
  );

  // Update order status in your database
  await Order.findByIdAndUpdate(req.body.orderId, {
    isPaid: true,
    paidAt: Date.now(),
    paymentResult: {
      id: data.id,
      status: data.status,
      update_time: data.update_time,
      email_address: data.payer.email_address
    }
  });

  res.status(200).json({ status: 'success', data });
});

// Revolut Implementation
exports.processRevolutPayment = catchAsync(async (req, res, next) => {
  const { orderId, revolutToken } = req.body;
  const order = await Order.findById(orderId);

  const response = await axios.post(
    'https://merchant.revolut.com/api/1.0/orders',
    {
      amount: Math.round(order.totalPrice * 100), // in cents
      currency: 'EUR',
      customer_id: req.user._id,
      description: `FoF Order #${order._id}`,
      merchant_order_ext_ref: order._id,
      capture_mode: 'AUTOMATIC'
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.REVOLUT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // Save payment details
  order.paymentResult = {
    id: response.data.id,
    status: response.data.state,
    update_time: new Date().toISOString()
  };
  await order.save();

  res.status(200).json({ status: 'success', data: response.data });
});

// Stripe (Credit Card) Implementation
exports.processStripePayment = catchAsync(async (req, res, next) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const { orderId, stripeToken } = req.body;
  const order = await Order.findById(orderId);

  const charge = await stripe.charges.create({
    amount: Math.round(order.totalPrice * 100), // in cents
    currency: 'eur',
    source: stripeToken,
    description: `FoF Order #${order._id}`,
    metadata: { order_id: order._id.toString() }
  });

  // Update order status
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: charge.id,
    status: charge.status,
    update_time: new Date().toISOString()
  };
  await order.save();

  res.status(200).json({ status: 'success', data: charge });
});

// Webhook Handlers
exports.payPalWebhook = catchAsync(async (req, res, next) => {
  const event = req.body;
  
  // Verify webhook signature
  const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID;
  const response = await axios.post(
    `${process.env.PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`,
    {
      auth_algo: req.headers['paypal-auth-algo'],
      cert_url: req.headers['paypal-cert-url'],
      transmission_id: req.headers['paypal-transmission-id'],
      transmission_sig: req.headers['paypal-transmission-sig'],
      transmission_time: req.headers['paypal-transmission-time'],
      webhook_id: paypalWebhookId,
      webhook_event: event
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getPayPalAccessToken()}`
      }
    }
  );

  if (response.data.verification_status !== 'SUCCESS') {
    return next(new AppError('Webhook signature verification failed', 400));
  }

  // Handle different event types
  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      // Update order status
      break;
    case 'PAYMENT.CAPTURE.DENIED':
      // Handle failed payment
      break;
    // Add other cases as needed
  }

  res.status(200).json({ received: true });
});

// Helper function for PayPal auth
const getPayPalAccessToken = async () => {
  const { data } = await axios.post(
    `${process.env.PAYPAL_API_URL}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_SECRET
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  return data.access_token;
};
// Add to paymentController.js
exports.handlePaymentWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Update order status
      break;
    case 'payment_intent.payment_failed':
      // Handle failed payment
      break;
  }

  res.json({ received: true });
});
// In your backend (controllers/paymentController.js)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = asyncHandler(async (req, res, next) => {
  const { amount, currency = 'eur', metadata = {} } = req.body;
  
  // Validate amount
  if (!amount || amount < 1) {
    return next(new AppError('Invalid payment amount', 400));
  }
  
  // Create PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // in cents
    currency,
    metadata: {
      userId: req.user._id.toString(),
      ...metadata
    }
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      clientSecret: paymentIntent.client_secret
    }
  });
});

// Frontend integration
async function handleStripePayment() {
  try {
    // 1. Create payment intent
    const response = await secureFetch('/api/payment/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: calculateOrderTotal(), // Your order total in EUR
        metadata: {
          orderType: document.getElementById('deliveryType').value
        }
      })
    });
    
    const { data } = await response.json();
    
    // 2. Confirm card payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: document.getElementById('cardName').value
          }
        }
      }
    );
    
    if (error) throw error;
    return paymentIntent;
  } catch (error) {
    console.error('Stripe error:', error);
    throw error;
  }
}
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

// @desc    Create checkout session
// @route   POST /api/checkout
// @access  Private
exports.createCheckoutSession = asyncHandler(async (req, res, next) => {
  const { shippingAddressId, paymentMethod } = req.body;
  
  // 1. Get user's cart
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart is empty', 400));
  }

  // 2. Validate cart items
  for (const item of cart.items) {
    if (!item.product.isActive) {
      return next(new AppError(`Product ${item.product.name} is no longer available`, 400));
    }
    
    // Additional validation based on delivery type
    if (item.deliveryType === 'daily' || item.deliveryType === 'weekly') {
      if (!item.deliverySchedule || !item.deliverySchedule.startDate) {
        return next(new AppError('Please select delivery schedule for subscription items', 400));
      }
    }
  }

  // 3. Create order (but don't save yet)
  const order = new Order({
    user: req.user._id,
    items: cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      deliveryType: item.deliveryType,
      deliverySchedule: item.deliverySchedule
    })),
    shippingAddress: shippingAddressId,
    paymentMethod,
    subtotal: cart.totalPrice,
    tax: cart.totalPrice * 0.1, // Example 10% tax
    shippingFee: calculateShippingFee(cart),
    total: calculateTotal(cart)
  });

  // 4. Process payment (we'll implement this next)
  const paymentResult = await processPayment(order, paymentMethod);
  
  if (!paymentResult.success) {
    return next(new AppError(paymentResult.message, 400));
  }

  // 5. Update order with payment details
  order.paymentStatus = 'paid';
  order.transactionId = paymentResult.transactionId;
  
  // 6. Save order
  await order.save();
  
  // 7. Clear cart
  await Cart.findOneAndDelete({ user: req.user._id });
  
  // 8. Send confirmation email (you'll implement this)
  sendOrderConfirmationEmail(req.user, order);

  res.status(201).json({
    status: 'success',
    data: order
  });
});

function calculateShippingFee(cart) {
  // Implement your shipping logic
  // Example: free shipping for orders over €50
  return cart.totalPrice > 50 ? 0 : 5;
}

function calculateTotal(cart) {
  const subtotal = cart.totalPrice;
  const tax = subtotal * 0.1; // Example 10% tax
  const shipping = calculateShippingFee(cart);
  return subtotal + tax + shipping;
}

async function processPayment(order, paymentMethod) {
  // We'll implement this properly with Stripe/PayPal
  // For now, just mock it
  return {
    success: true,
    transactionId: 'mock_' + Math.random().toString(36).substring(7),
    message: 'Payment processed successfully'
  };
}