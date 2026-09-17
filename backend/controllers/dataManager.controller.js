const Archive = require('../models/Archive');

const ALLOWED_MODELS = {
  students: { model: require('../models/Student'), archiveName: 'Student', label: 'Students' },
  teachers: { model: require('../models/Teacher'), archiveName: 'Teacher', label: 'Teachers' },
  classes: { model: require('../models/Class'), archiveName: 'Class', label: 'Classes' },
  expenses: { model: require('../models/Expense'), archiveName: 'Expense', label: 'Expenses' },
  testResults: { model: require('../models/TestResult'), archiveName: 'TestResult', label: 'Test Results' },
  resultCards: { model: require('../models/ResultCard'), archiveName: 'ResultCard', label: 'Result Cards' },
  examRegistrations: { model: require('../models/ExamRegistration'), archiveName: 'ExamRegistration', label: 'Exam Registrations' },
  salaryHistories: { model: require('../models/SalaryHistory'), archiveName: 'SalaryHistory', label: 'Salary History' },
  feeHistories: { model: require('../models/FeeHistory'), archiveName: 'FeeHistory', label: 'Fee History' },
  archive: { model: require('../models/Archive'), archiveName: 'Archive', label: 'Trash/Archive' }
};

exports.getAvailableModels = async (req, res) => {
  try {
    const models = Object.keys(ALLOWED_MODELS).map(key => ({ key, label: ALLOWED_MODELS[key].label }));
    res.status(200).json({ success: true, data: models });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch models' });
  }
};

exports.getData = async (req, res) => {
  try {
    const modelConfig = ALLOWED_MODELS[req.params.model];
    if (!modelConfig) return res.status(400).json({ success: false, error: 'Invalid data source' });

    const { search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { className: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      modelConfig.model.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }).lean(),
      modelConfig.model.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true, modelName: modelConfig.label, data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch data' });
  }
};

exports.updateData = async (req, res) => {
  try {
    const modelConfig = ALLOWED_MODELS[req.params.model];
    if (!modelConfig) return res.status(400).json({ success: false, error: 'Invalid data source' });

    const record = await modelConfig.model.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, error: 'Record not found' });

    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v' && key !== 'createdAt') record[key] = req.body[key];
    });

    await record.save();
    res.status(200).json({ success: true, message: 'Record updated', data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update data' });
  }
};

exports.deleteData = async (req, res) => {
  try {
    const modelConfig = ALLOWED_MODELS[req.params.model];
    if (!modelConfig) return res.status(400).json({ success: false, error: 'Invalid data source' });

    const record = await modelConfig.model.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, error: 'Record not found' });

    const summary = record.fullName || record.className || record.subject || record.month || 'Unknown Record';
    await Archive.create({
      sourceModel: modelConfig.archiveName,
      originalData: record.toObject(),
      recordId: record._id.toString(),
      summary,
      deletedBy: req.user.id,
      reason: 'Deleted from Data Manager'
    });

    await modelConfig.model.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Record moved to trash' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete data' });
  }
};