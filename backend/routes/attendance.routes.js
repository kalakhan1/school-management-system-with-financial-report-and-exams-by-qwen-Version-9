const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAcademicStaff, isAdmin } = require('../middleware/roleCheck');
const { 
  markAttendance, 
  getAttendance, 
  getAttendanceForDate, 
  getAttendanceReport,
  deleteAttendance,
  getAttendanceClasses
} = require('../controllers/attendance.controller');
const { markAttendanceValidation, getAttendanceValidation } = require('../validators/attendance.validator');

router.use(protect);

// Get classes for filter
router.get('/classes', isAcademicStaff, getAttendanceClasses);

// Report (read-only)
router.get('/report', isAcademicStaff, getAttendanceReport);

// Get attendance records
router.get('/', isAcademicStaff, getAttendanceValidation, getAttendance);

// Get attendance for specific date (for marking UI)
router.get('/date/:date', isAcademicStaff, getAttendanceForDate);

// Mark attendance (create/update)
router.post('/mark', isAcademicStaff, markAttendanceValidation, markAttendance);

// Delete attendance record
router.delete('/:id', isAdmin, deleteAttendance);

module.exports = router;