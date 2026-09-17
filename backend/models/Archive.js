const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema({
  sourceModel: { type: String, required: true },
  originalData: { type: Object, required: true },
  recordId: { type: String, required: true },
  summary: { type: String, default: 'Archived Record' },
  reason: { type: String, trim: true },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Archive', archiveSchema);