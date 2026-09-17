const Teacher = require('../models/Teacher');
const { validationResult } = require('express-validator');

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch teachers' });
  }
};

exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, error: 'Teacher not found' });
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch teacher' });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
    const teacher = await Teacher.create(req.body);
    res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'Employee Code already exists' });
    res.status(500).json({ success: false, error: 'Failed to create teacher' });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!teacher) return res.status(404).json({ success: false, error: 'Teacher not found' });
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'Employee Code already exists' });
    res.status(500).json({ success: false, error: 'Failed to update teacher' });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, error: 'Teacher not found' });
    res.status(200).json({ success: true, message: 'Teacher deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete teacher' });
  }
};