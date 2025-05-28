const mongoose = require('mongoose');
const deliverySchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  status: { type: String, default: 'pending' },
  deliveryDate: Date
});