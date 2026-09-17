const Exam = require('../models/Exam');
const ExamRegistration = require('../models/ExamRegistration');
const Archive = require('../models/Archive');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');

// @desc    Get All Exams
exports.getExams = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch exams' });
  }
};

// @desc    Create Exam
exports.createExam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
    const exam = await Exam.create(req.body);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create exam' });
  }
};

// @desc    Delete Exam
exports.deleteExam = async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete exam' });
  }
};

// @desc    Register Student for Exam
exports.registerStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });

    const registration = await ExamRegistration.create({
      ...req.body,
      registeredBy: req.user.id
    });
    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'Student already registered for this exam' });
    res.status(500).json({ success: false, error: 'Failed to register student' });
  }
};

// @desc    Get Exam Registrations (with search)
exports.getRegistrations = async (req, res) => {
  try {
    const { examType, examYear, search, limit = 100 } = req.query;
    const filter = {};
    if (examType) filter.examType = examType;
    if (examYear) filter.examYear = parseInt(examYear);

    if (search) {
      const students = await Student.find({ fullName: { $regex: search, $options: 'i' } }).select('_id');
      if (students.length > 0) {
        filter.student = { $in: students.map(s => s._id) };
      } else {
        return res.status(200).json({ success: true, data: [] });
      }
    }

    const registrations = await ExamRegistration.find(filter)
      .populate('student', 'fullName class grNo')
      .populate('registeredBy', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({ success: true, data: registrations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
  }
};

// @desc    Update Registration
exports.updateRegistration = async (req, res) => {
  try {
    const reg = await ExamRegistration.findById(req.params.id);
    if (!reg) return res.status(404).json({ success: false, error: 'Registration not found' });

    if (req.body.rollNumber) reg.rollNumber = req.body.rollNumber;
    if (req.body.subjects) reg.subjects = req.body.subjects;
    if (req.body.feeStatus) reg.feeStatus = req.body.feeStatus;
    
    await reg.save();
    res.status(200).json({ success: true, data: reg });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update registration' });
  }
};

// @desc    Delete Registration (Move to Trash)
exports.deleteRegistration = async (req, res) => {
  try {
    const reg = await ExamRegistration.findById(req.params.id);
    if (!reg) return res.status(404).json({ success: false, error: 'Registration not found' });

    await Archive.create({
      sourceModel: 'ExamRegistration',
      originalData: reg.toObject(),
      recordId: reg._id.toString(),
      summary: `Registration: ${reg.examType} ${reg.examYear}`,
      deletedBy: req.user.id,
      reason: 'Deleted from Exam Registration'
    });

    await ExamRegistration.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Moved to trash' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete registration' });
  }
};