const Class = require('../models/Class');
const Student = require('../models/Student');

// @desc    Get All Classes with Student Count
// @route   GET /api/classes
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort({ className: 1 }).lean();
    
    // ✅ NEW: Calculate student count for each class
    const classesWithCount = await Promise.all(classes.map(async (cls) => {
      const studentCount = await Student.countDocuments({ 
        class: cls.className, 
        status: 'Active' 
      });
      
      return {
        ...cls,
        studentCount,
        totalStudents: studentCount // Alias for clarity
      };
    }));

    res.status(200).json({ success: true, data: classesWithCount });
  } catch (error) {
    console.error('Get Classes Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch classes' });
  }
};

// @desc    Create Class
// @route   POST /api/classes
exports.createClass = async (req, res) => {
  try {
    const { className, section } = req.body;
    if (!className) return res.status(400).json({ success: false, error: 'Class name is required' });
    
    const classDoc = await Class.create({ className, section: section || 'A' });
    res.status(201).json({ success: true, data: classDoc });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'Class already exists' });
    res.status(500).json({ success: false, error: 'Failed to create class' });
  }
};

// @desc    Delete Class
// @route   DELETE /api/classes/:id
exports.deleteClass = async (req, res) => {
  try {
    // Check if students are enrolled
    const studentCount = await Student.countDocuments({ class: req.params.className });
    if (studentCount > 0) return res.status(400).json({ success: false, error: `Cannot delete class. ${studentCount} students are enrolled.` });

    await Class.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Class deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete class' });
  }
};