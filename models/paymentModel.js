const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'wallet'],
      required: true,
    },
    status: {
      type: String,
      enum: ['successful', 'failed', 'pending'],
      default: 'pending',
    },
    reference: {
      type: String,
      required: true,
    },
    paidAt: Date,
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;

