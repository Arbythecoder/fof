const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  customizations: Object
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  deliveryType: {
    type: String,
    enum: ['one-time', 'daily', 'weekly'],
    default: 'one-time'
  },
  deliverySchedule: {
    startDate: Date,
    days: [String] // For weekly subscriptions
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);