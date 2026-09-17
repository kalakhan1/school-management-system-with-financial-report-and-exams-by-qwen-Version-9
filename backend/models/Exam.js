const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  examType: { type: String, required: true, enum: ['Mid-Term', 'Annual', 'Term', 'Supplementary', 'Pre-Board'] },
  examYear: { type: Number, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);