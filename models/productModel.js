const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: {
    type: String,
    enum: ['daily', 'weekly', 'party', 'bottomless'],
    required: true
  },
  image: String,
  ingredients: [String],
  isActive: { type: Boolean, default: true },
  customizationOptions: {
    ingredients: [{
      name: String,
      price: Number
    }],
    flavors: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);