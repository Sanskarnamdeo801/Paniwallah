const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  qty: { type: Number, default: 1 },
  price: Number
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [itemSchema],
  totalAmount: Number,
  address: String,
  orderStatus: {
    type: String,
    enum: ['Pending','Confirmed','Out for Delivery','Delivered','Cancelled'],
    default: 'Pending'
  },
  paymentMethod: { type: String, enum: ['COD'], default: 'COD' },
  paymentStatus: { type: String, enum: ['COD','Pending'], default: 'COD' },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

