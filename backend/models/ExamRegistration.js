const mongoose = require('mongoose');

const examRegistrationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examType: { type: String, required: true },
  examYear: { type: Number, required: true },
  subjects: [{ type: String, required: true }],
  rollNumber: { type: String, required: true },
  feeStatus: { type: String, enum: ['Cleared', 'Pending', 'Special Permission'], default: 'Pending' },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Prevent duplicate registration for same student + exam type + year
examRegistrationSchema.index({ student: 1, examType: 1, examYear: 1 }, { unique: true });

module.exports = mongoose.model('ExamRegistration', examRegistrationSchema);