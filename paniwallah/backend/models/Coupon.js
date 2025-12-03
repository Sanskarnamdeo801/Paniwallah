const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  discountPercent: Number,
  validFrom: Date,
  validTo: Date,
  minAmount: Number,
  usageLimit: Number
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);

