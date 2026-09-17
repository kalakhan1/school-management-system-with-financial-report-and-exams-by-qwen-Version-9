const FeeHistory = require('../models/FeeHistory');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');

// @desc    Collect Fee
exports.collectFee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });

    const feeRecord = await FeeHistory.create({
      ...req.body,
      collectedBy: req.user.id
    });

    res.status(201).json({ success: true, data: feeRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to collect fee' });
  }
};

// @desc    Get Fee History
exports.getFeeHistory = async (req, res) => {
  try {
    const history = await FeeHistory.find()
      .populate('student', 'fullName class')
      .populate('collectedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch fee history' });
  }
};

// @desc    Get Student Fee Status (Simple calculation)
exports.getStudentFeeStatus = async (req, res) => {
  try {
    const students = await Student.find({ status: 'Active' }).select('fullName class fee discount');
    const statusList = [];

    for (const student of students) {
      const netFee = (student.fee || 0) - (student.discount || 0);
      const totalPaid = await FeeHistory.find({ student: student._id }).sum('amount') || 0; // Note: .sum() is a mongoose helper, or use reduce
      
      // Fallback if sum() fails in some mongoose versions
      const payments = await FeeHistory.find({ student: student._id }).select('amount');
      const paid = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

      statusList.push({
        student: { _id: student._id, fullName: student.fullName, class: student.class },
        netFee,
        totalPaid: paid,
        outstanding: Math.max(0, netFee - paid)
      });
    }
    res.status(200).json({ success: true, data: statusList });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch status' });
  }
};