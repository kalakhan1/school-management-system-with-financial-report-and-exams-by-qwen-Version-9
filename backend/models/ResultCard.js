const mongoose = require('mongoose');

const resultCardSchema = new mongoose.Schema({
  registration: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamRegistration', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subjectMarks: [{
    subject: { type: String, required: true },
    obtained: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 }
  }],
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  grade: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ResultCard', resultCardSchema);