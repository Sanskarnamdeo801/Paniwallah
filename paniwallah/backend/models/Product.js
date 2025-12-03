const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // business owner
  unit: { type: String, default: 'bottle' } // bottle, tanker, etc.
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

