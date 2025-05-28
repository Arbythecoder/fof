const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/orderModel');
const Subscription = require('../models/subscriptionModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.handleStripeWebhook = catchAsync(async (req, res) => {
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

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handleSuccessfulPayment(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleFailedPayment(event.data.object);
      break;
  }

  res.json({ received: true });
});

async function handleSuccessfulPayment(paymentIntent) {
  // Update order/subscription status
}