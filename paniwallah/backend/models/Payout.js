const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  period: {
    from: Date,
    to: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'UPI', 'Cash'],
    default: 'Bank Transfer'
  },
  transactionId: String,
  notes: String,
  processedBy: String,
  processedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payout', payoutSchema);
