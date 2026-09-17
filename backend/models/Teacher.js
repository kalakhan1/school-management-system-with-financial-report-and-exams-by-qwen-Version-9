const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  empCode: { type: String, unique: true, sparse: true, trim: true },
  cnic: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  qualification: { type: String, trim: true },
  subjects: [{ type: String, trim: true }],
  monthlyPackage: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive', 'Resigned'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);