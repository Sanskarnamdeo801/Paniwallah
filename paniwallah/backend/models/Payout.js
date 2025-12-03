const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  status: { type: String, enum: ['pending','paid','rejected'], default: 'pending' },
  metadata: Object
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);

