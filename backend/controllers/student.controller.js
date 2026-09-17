const Student = require('../models/Student');
const { validationResult } = require('express-validator');

// @desc    Get all students
exports.getStudents = async (req, res) => {
  try {
    const { search, limit = 100, page = 1 } = req.query;
    const filter = {};
    if (search) filter.fullName = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [students, total] = await Promise.all([
      Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Student.countDocuments(filter)
    ]);

    res.status(200).json({ success: true, data: students, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
};

// @desc    Get single student
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch student' });
  }
};

// @desc    Create student
exports.createStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });

    const student = await Student.create(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'GR Number already exists' });
    res.status(500).json({ success: false, error: 'Failed to create student' });
  }
};

// @desc    Update student
exports.updateStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });

    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'GR Number already exists' });
    res.status(500).json({ success: false, error: 'Failed to update student' });
  }
};

// @desc    Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    res.status(200).json({ success: true, message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete student' });
  }
};