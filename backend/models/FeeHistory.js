const mongoose = require('mongoose');

const feeHistorySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true, min: 0 },
  month: { type: String, required: true }, // e.g., "September 2026"
  paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque', 'Online'], default: 'Cash' },
  remarks: { type: String, trim: true },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('FeeHistory', feeHistorySchema);