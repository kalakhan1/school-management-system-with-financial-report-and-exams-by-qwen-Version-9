const Archive = require('../models/Archive');

// @desc    Get All Archived Items
exports.getArchive = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const [archive, total] = await Promise.all([
      Archive.find().populate('deletedBy', 'username fullName').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Archive.countDocuments()
    ]);

    res.status(200).json({
      success: true, data: archive,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch archive' });
  }
};

// @desc    Move to Trash (Generic)
exports.moveToTrash = async (req, res) => {
  try {
    const { modelName, recordId, reason } = req.body;
    if (!modelName || !recordId) return res.status(400).json({ success: false, error: 'Model name and record ID required' });

    let Model;
    try { Model = require(`../models/${modelName}`); } 
    catch (err) { return res.status(400).json({ success: false, error: `Model ${modelName} not found` }); }

    const record = await Model.findById(recordId);
    if (!record) return res.status(404).json({ success: false, error: 'Record not found' });

    const summary = record.fullName || record.className || record.subject || record.month || `${modelName} Record`;

    await Archive.create({
      sourceModel: modelName,
      originalData: record.toObject(),
      recordId: record._id.toString(),
      summary,
      deletedBy: req.user.id,
      reason: reason || 'Moved to trash'
    });

    await Model.findByIdAndDelete(recordId);
    res.status(200).json({ success: true, message: 'Moved to trash successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to move to trash: ' + error.message });
  }
};

// @desc    Restore from Archive
exports.restoreFromArchive = async (req, res) => {
  try {
    const archive = await Archive.findById(req.params.id);
    if (!archive) return res.status(404).json({ success: false, error: 'Archive record not found' });

    const modelName = archive.sourceModel;
    let Model;
    try { Model = require(`../models/${modelName}`); } 
    catch (err) { return res.status(400).json({ success: false, error: `Model ${modelName} not found` }); }

    const dataToRestore = { ...archive.originalData };
    delete dataToRestore._id;
    delete dataToRestore.createdAt;
    delete dataToRestore.updatedAt;
    delete dataToRestore.__v;

    try {
      let existingRecord = null;
      if (modelName === 'ResultCard' && dataToRestore.registration) {
        existingRecord = await Model.findOne({ registration: dataToRestore.registration });
      } else if (modelName === 'ExamRegistration' && dataToRestore.student && dataToRestore.examType) {
        existingRecord = await Model.findOne({ student: dataToRestore.student, examType: dataToRestore.examType, examYear: dataToRestore.examYear });
      }

      if (existingRecord) {
        Object.assign(existingRecord, dataToRestore);
        await existingRecord.save();
      } else {
        await Model.create(dataToRestore);
      }
    } catch (createError) {
      if (createError.code === 11000) {
        return res.status(400).json({ success: false, error: 'Duplicate record exists. Cannot restore.' });
      }
      throw createError;
    }

    await Archive.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Record restored successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to restore: ' + error.message });
  }
};

// @desc    Delete Permanently
exports.deleteFromArchive = async (req, res) => {
  try {
    await Archive.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete' });
  }
};