// models/Subscription.js
const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'completed'],
    default: 'active'
  },
  frequency: { type: String, enum: ['daily', 'weekly'], required: true },
  deliveryDays: [String],
  nextDeliveryDate: Date,
  remainingDeliveries: Number,
  paymentMethod: String,
  billingCycle: String,
  history: [{
    deliveryDate: Date,
    status: String,
    trackingNumber: String
  }]
}, { timestamps: true });

// utils/subscriptionScheduler.js
const cron = require('node-cron');

function scheduleSubscriptionDeliveries() {
  // Run every day at 3 AM
  cron.schedule('0 3 * * *', async () => {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Find subscriptions due for delivery today
    const subscriptions = await Subscription.find({
      status: 'active',
      nextDeliveryDate: { $lte: today },
      $or: [
        { frequency: 'daily' },
        { deliveryDays: dayName }
      ]
    }).populate('user product');
    
    for (const sub of subscriptions) {
      try {
        // Create delivery order
        const order = await Order.create({
          user: sub.user._id,
          items: [{
            product: sub.product._id,
            name: sub.product.name,
            price: sub.product.price,
            quantity: 1,
            deliveryType: sub.frequency
          }],
          shippingAddress: sub.user.defaultAddress,
          paymentMethod: sub.paymentMethod,
          paymentStatus: 'paid',
          deliveryStatus: 'processing',
          total: sub.product.price
        });
        
        // Update subscription
        sub.history.push({
          deliveryDate: today,
          status: 'processed',
          order: order._id
        });
        
        if (sub.remainingDeliveries > 0) {
          sub.remainingDeliveries -= 1;
        }
        
        if (sub.remainingDeliveries === 0) {
          sub.status = 'completed';
        } else {
          // Calculate next delivery date
          sub.nextDeliveryDate = calculateNextDeliveryDate(sub);
        }
        
        await sub.save();
        
        // Send notification
        sendDeliveryNotification(sub.user, order);
        
      } catch (error) {
        console.error(`Failed to process subscription ${sub._id}:`, error);
      }
    }
  });
}