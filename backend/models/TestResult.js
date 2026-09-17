const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  testType: { type: String, required: true, enum: ['Weekly', 'Monthly', 'Quarterly', 'Half-Yearly', 'Pre-Board'] },
  subject: { type: String, required: true },
  marks: { type: Number, required: true, min: 0 },
  totalMarks: { type: Number, required: true, min: 1 },
  percentage: { type: Number, required: true },
  testDate: { type: Date, default: Date.now },
  remarks: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('TestResult', testResultSchema);