const mongoose = require('mongoose');

const businessDetailsSchema = new mongoose.Schema({
  name: String,
  gst: String,
  address: String,
  approved: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user','admin','business'], default: 'user' },
  businessDetails: businessDetailsSchema,
  fcmToken: { type: String },
  balance: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

