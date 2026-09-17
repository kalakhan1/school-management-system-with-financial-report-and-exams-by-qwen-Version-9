const TestResult = require('../models/TestResult');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');

// @desc    Add Test Result
exports.addTestResult = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });

    const testResult = await TestResult.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: testResult });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add test result' });
  }
};

// @desc    Get Test Results
exports.getTestResults = async (req, res) => {
  try {
    const { testType, search, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (testType) filter.testType = testType;
    if (search) filter.subject = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
      TestResult.find(filter).populate('student', 'fullName class').sort({ testDate: -1 }).skip(skip).limit(parseInt(limit)),
      TestResult.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true, data: results,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch test results' });
  }
};

// @desc    Delete Test Result
exports.deleteTestResult = async (req, res) => {
  try {
    await TestResult.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Test result deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete test result' });
  }
};