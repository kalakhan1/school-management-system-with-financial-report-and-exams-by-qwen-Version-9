const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  schoolName: { type: String, default: 'School ERP' },
  schoolAddress: { type: String, default: '' },
  schoolPhone: { type: String, default: '' },
  schoolEmail: { type: String, default: '' },
  academicYear: { type: String, default: '2026-2027' },
  currency: { type: String, default: 'Rs.' }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);