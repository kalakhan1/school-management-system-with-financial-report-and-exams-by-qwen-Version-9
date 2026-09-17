const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  grNo: { type: String, unique: true, sparse: true, trim: true },
  fatherName: { type: String, required: true, trim: true },
  class: { type: String, required: true },
  section: { type: String, default: 'A', trim: true },
  rollNo: { type: String, trim: true },
  admissionDate: { type: Date, default: Date.now },
  fee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  phone: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  imageURL: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Left'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);