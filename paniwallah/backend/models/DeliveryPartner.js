const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  vehicle: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);

