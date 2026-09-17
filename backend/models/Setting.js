const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  schoolName: { type: String, default: 'School ERP' },
  schoolAddress: { type: String, default: '' },
  schoolPhone: { type: String, default: '' },
  schoolEmail: { type: String, default: '' },
  academicYear: { type: String, default: '2026-2027' },
  currency: { type: String, default: 'Rs.' },
  
  // ✅ NEW: Theme Color
  themeColor: { 
    type: String, 
    default: '#0d6efd', // Bootstrap primary blue
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);