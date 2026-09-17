const TestResult = require('../models/TestResult');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');
const { logAudit, logError } = require('../utils/logger');

// @desc    Add Test Result
// @route   POST /api/test-results
exports.addTestResult = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });

    const testResult = await TestResult.create({
      ...req.body,
      createdBy: req.user.id
    });

    await logAudit('TEST_RESULT_ADDED', { 
      userId: req.user.id, 
      studentId: req.body.student, 
      subject: req.body.subject,
      testType: req.body.testType
    });

    res.status(201).json({ success: true, data: testResult });
  } catch (error) {
    await logError(error, { context: 'addTestResult' });
    res.status(500).json({ success: false, error: 'Failed to add test result' });
  }
};

// @desc    Get Test Results (with filters)
// @route   GET /api/test-results
exports.getTestResults = async (req, res) => {
  try {
    const { 
      testType, search, className, subject,
      limit = 50, page = 1 
    } = req.query;

    const filter = {};
    
    // Test type filter
    if (testType) filter.testType = testType;
    
    // Subject filter
    if (subject) filter.subject = { $regex: subject, $options: 'i' };

    // ✅ NEW: Student name search + Class filter
    if (search || className) {
      const studentFilter = {};
      
      if (search) {
        studentFilter.fullName = { $regex: search, $options: 'i' };
      }
      if (className) {
        studentFilter.class = className;
      }

      const matchingStudents = await Student.find(studentFilter).select('_id');
      
      if (matchingStudents.length === 0) {
        // No students match the filter, return empty result
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, totalPages: 0 }
        });
      }
      
      filter.student = { $in: matchingStudents.map(s => s._id) };
    }

    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
      TestResult.find(filter)
        .populate('student', 'fullName class grNo rollNo')
        .populate('createdBy', 'username fullName')
        .sort({ testDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TestResult.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true, 
      data: results,
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total, 
        totalPages: Math.ceil(total / limit) 
      }
    });
  } catch (error) {
    await logError(error, { context: 'getTestResults' });
    res.status(500).json({ success: false, error: 'Failed to fetch test results' });
  }
};

// @desc    Get Single Test Result
// @route   GET /api/test-results/:id
exports.getTestResultById = async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id)
      .populate('student', 'fullName class grNo')
      .populate('createdBy', 'username fullName');
    
    if (!result) return res.status(404).json({ success: false, error: 'Test result not found' });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch test result' });
  }
};

// @desc    Update Test Result
// @route   PUT /api/test-results/:id
exports.updateTestResult = async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, error: 'Test result not found' });

    if (req.body.marks !== undefined) result.marks = req.body.marks;
    if (req.body.totalMarks !== undefined) result.totalMarks = req.body.totalMarks;
    if (req.body.subject) result.subject = req.body.subject;
    if (req.body.testType) result.testType = req.body.testType;
    if (req.body.testDate) result.testDate = req.body.testDate;
    if (req.body.remarks !== undefined) result.remarks = req.body.remarks;

    // Recalculate percentage
    if (result.totalMarks > 0) {
      result.percentage = (result.marks / result.totalMarks) * 100;
    }

    await result.save();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update test result' });
  }
};

// @desc    Delete Test Result
// @route   DELETE /api/test-results/:id
exports.deleteTestResult = async (req, res) => {
  try {
    const result = await TestResult.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, error: 'Test result not found' });

    await logAudit('TEST_RESULT_DELETED', { 
      userId: req.user.id, 
      resultId: result._id,
      studentId: result.student
    });

    res.status(200).json({ success: true, message: 'Test result deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete test result' });
  }
};