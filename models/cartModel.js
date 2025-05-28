const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: String,
  price: { type: Number, required: true },
  customizations: {
    selectedIngredients: [String],
    selectedAdditives: [String]
  },
  deliveryType: {
    type: String,
    enum: ['one-time', 'daily', 'weekly'],
    required: true,
    validate: {
      validator: function(v) {
        // If product is subscription-based, deliveryType must be daily/weekly
        const product = this.parent().products.find(p => p._id.equals(this.product));
        if (product?.category === 'daily' || product?.category === 'weekly') {
          return ['daily', 'weekly'].includes(v);
        }
        return true;
      },
      message: 'Subscription products require daily/weekly delivery'
    }
  },
  deliverySchedule: {
    frequency: String,
    deliveryDays: [String],
    startDate: Date,
    duration: Number // in weeks
  }
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  totalPrice: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Calculate total price before saving
cartSchema.pre('save', function(next) {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  this.updatedAt = Date.now();
  next();
});