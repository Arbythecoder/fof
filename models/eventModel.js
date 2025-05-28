const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventType: { 
    type: String,
    enum: ['private-dinner', 'cooking-class', 'corporate-event', 'birthday-party', 'wedding', 'other'],
    required: true
  },
  eventDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: String,
  guests: { type: Number, min: 10, max: 100, required: true },
  specialRequests: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'partial'],
    default: 'unpaid'
  },
  
  quoteAmount: Number,
  createdAt: { type: Date, default: Date.now }
});

// Export your model
module.exports = mongoose.model('Event', eventSchema);