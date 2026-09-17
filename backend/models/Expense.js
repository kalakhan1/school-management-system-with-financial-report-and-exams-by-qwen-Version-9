const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: { type: String, required: true, enum: ['Utilities', 'Maintenance', 'Supplies', 'Transport', 'Miscellaneous'] },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true },
  date: { type: Date, default: Date.now },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);