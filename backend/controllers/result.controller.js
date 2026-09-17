const ResultCard = require('../models/ResultCard');
const ExamRegistration = require('../models/ExamRegistration');
const { validationResult } = require('express-validator');

// @desc    Get All Result Cards
exports.getResultCards = async (req, res) => {
  try {
    const results = await ResultCard.find()
      .populate('student', 'fullName class grNo')
      .populate('registration', 'examType examYear rollNumber')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch results' });
  }
};

// @desc    Get Single Result Card (For Print)
exports.getResultCardById = async (req, res) => {
  try {
    const result = await ResultCard.findById(req.params.id)
      .populate('student', 'fullName class grNo section')
      .populate('registration', 'examType examYear rollNumber');
    if (!result) return res.status(404).json({ success: false, error: 'Result not found' });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch result' });
  }
};

// @desc    Create Result Card
exports.createResultCard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });

    const result = await ResultCard.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'Result card already exists for this registration' });
    res.status(500).json({ success: false, error: 'Failed to create result card' });
  }
};

// @desc    Delete Result Card
exports.deleteResultCard = async (req, res) => {
  try {
    await ResultCard.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Result card deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete result card' });
  }
};