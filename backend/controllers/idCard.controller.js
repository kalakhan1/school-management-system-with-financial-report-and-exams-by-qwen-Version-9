const Student = require('../models/Student');
const Setting = require('../models/Setting');

// @desc    Get Student Data for ID Card
exports.getStudentForIdCard = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const settings = await Setting.findOne().lean() || {};

    res.status(200).json({
      success: true,
      data: { student, school: settings }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch student data' });
  }
};