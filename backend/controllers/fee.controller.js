const FeeHistory = require('../models/FeeHistory');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');
const { logAudit, logError } = require('../utils/logger');

// @desc    Collect Fee
// @route   POST /api/fees/collect
exports.collectFee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });

    const feeRecord = await FeeHistory.create({
      ...req.body,
      collectedBy: req.user.id
    });

    await logAudit('FEE_COLLECTED', { userId: req.user.id, studentId: req.body.student, amount: req.body.amount });
    res.status(201).json({ success: true, data: feeRecord });
  } catch (error) {
    await logError(error, { context: 'collectFee' });
    res.status(500).json({ success: false, error: 'Failed to collect fee' });
  }
};

// @desc    Get Fee History
// @route   GET /api/fees/history
exports.getFeeHistory = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      FeeHistory.find()
        .populate('student', 'fullName class')
        .populate('collectedBy', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FeeHistory.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: history,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    await logError(error, { context: 'getFeeHistory' });
    res.status(500).json({ success: false, error: 'Failed to fetch fee history' });
  }
};

// @desc    Get All Students Fee Status (Array format)
// @route   GET /api/fees/status
exports.getStudentFeeStatus = async (req, res) => {
  try {
    // ✅ FIX: Get all active students with lean() for better performance
    const students = await Student.find({ status: 'Active' })
      .select('fullName class fee discount')
      .lean();

    // ✅ FIX: Use Promise.all for parallel queries (no N+1 problem)
    const statusList = await Promise.all(students.map(async (student) => {
      const netFee = (student.fee || 0) - (student.discount || 0);
      
      // ✅ FIX: Use reduce() instead of non-existent .sum() method
      const payments = await FeeHistory.find({ student: student._id })
        .select('amount')
        .lean();
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const outstanding = Math.max(0, netFee - totalPaid);

      return {
        student: {
          _id: student._id,
          fullName: student.fullName,
          class: student.class
        },
        netFee,
        totalPaid,
        outstanding
      };
    }));

    res.status(200).json({ success: true, data: statusList });
  } catch (error) {
    await logError(error, { context: 'getStudentFeeStatus' });
    res.status(500).json({ success: false, error: 'Failed to fetch fee status: ' + error.message });
  }
};

// @desc    Get Bulk Fee Status (Object format keyed by student ID)
// @route   GET /api/fees/status/bulk
exports.getBulkFeeStatus = async (req, res) => {
  try {
    const students = await Student.find({ status: 'Active' })
      .select('fullName class fee discount')
      .lean();

    const feeStatus = {};

    await Promise.all(students.map(async (student) => {
      const netFee = (student.fee || 0) - (student.discount || 0);
      
      const payments = await FeeHistory.find({ student: student._id })
        .select('amount')
        .lean();
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const outstanding = Math.max(0, netFee - totalPaid);

      feeStatus[student._id.toString()] = {
        student: {
          _id: student._id,
          fullName: student.fullName,
          class: student.class
        },
        netFee,
        totalPaid,
        outstanding
      };
    }));

    res.status(200).json({ success: true, data: feeStatus });
  } catch (error) {
    await logError(error, { context: 'getBulkFeeStatus' });
    res.status(500).json({ success: false, error: 'Failed to fetch bulk fee status' });
  }
};

// @desc    Get Outstanding Fees
// @route   GET /api/fees/outstanding
exports.getOutstandingFees = async (req, res) => {
  try {
    const students = await Student.find({ status: 'Active' }).lean();
    const outstandingList = [];

    await Promise.all(students.map(async (student) => {
      const netFee = (student.fee || 0) - (student.discount || 0);
      if (netFee <= 0) return;

      const payments = await FeeHistory.find({ student: student._id }).select('amount').lean();
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const outstanding = netFee - totalPaid;

      if (outstanding > 0) {
        outstandingList.push({
          student: {
            _id: student._id,
            fullName: student.fullName,
            class: student.class,
            phone: student.phone
          },
          feeData: { netFee, totalPaid, outstanding }
        });
      }
    }));

    res.status(200).json({ success: true, data: outstandingList });
  } catch (error) {
    await logError(error, { context: 'getOutstandingFees' });
    res.status(500).json({ success: false, error: 'Failed to fetch outstanding fees' });
  }
};