const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: { type: String, required: true, unique: true, trim: true },
  section: { type: String, default: 'A', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);