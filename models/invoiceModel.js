const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: Date,
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
