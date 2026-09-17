const SalaryHistory = require('../models/SalaryHistory');
const { validationResult } = require('express-validator');

exports.paySalary = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });

    const salaryRecord = await SalaryHistory.create({ ...req.body, paidBy: req.user.id });
    res.status(201).json({ success: true, data: salaryRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to pay salary' });
  }
};

exports.getSalaryHistory = async (req, res) => {
  try {
    const history = await SalaryHistory.find()
      .populate('teacher', 'fullName empCode')
      .populate('paidBy', 'username')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch salary history' });
  }
};