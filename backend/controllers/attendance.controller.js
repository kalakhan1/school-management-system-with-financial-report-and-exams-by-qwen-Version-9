const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { validationResult } = require('express-validator');
const { logAudit, logError } = require('../utils/logger');

// @desc    Mark Attendance (Bulk - Multiple Students/Teachers at once)
// @route   POST /api/attendance/mark
exports.markAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });

    const { type, date, className, records } = req.body;
    const attendanceDate = new Date(date);
    
    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    for (const record of records) {
      try {
        const filter = {
          type,
          date: attendanceDate,
          [type === 'student' ? 'student' : 'teacher']: record.personId
        };

        const updateData = {
          status: record.status,
          remarks: record.remarks || '',
          markedBy: req.user.id,
          ...(type === 'student' && className ? { className } : {})
        };

        // Use upsert to either create or update
        const result = await Attendance.findOneAndUpdate(
          filter,
          updateData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (result.wasPopulated || result.isNew) {
          results.updated++;
        } else {
          results.created++;
        }
      } catch (err) {
        results.errors.push({
          personId: record.personId,
          error: err.message
        });
      }
    }

    await logAudit('ATTENDANCE_MARKED', {
      userId: req.user.id,
      type,
      date: attendanceDate.toISOString(),
      className,
      records: records.length,
      created: results.created,
      updated: results.updated
    });

    res.status(200).json({
      success: true,
      message: `Attendance marked: ${results.created} created, ${results.updated} updated`,
      data: results
    });
  } catch (error) {
    await logError(error, { context: 'markAttendance' });
    res.status(500).json({ success: false, error: 'Failed to mark attendance: ' + error.message });
  }
};

// @desc    Get Attendance Records (with filters)
// @route   GET /api/attendance
exports.getAttendance = async (req, res) => {
  try {
    const { 
      type, date, startDate, endDate, 
      className, status, personId,
      limit = 100, page = 1 
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (className) filter.className = className;
    
    if (personId) {
      if (type === 'student') filter.student = personId;
      else if (type === 'teacher') filter.teacher = personId;
    }

    // Date filtering
    if (date) {
      const d = new Date(date);
      filter.date = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lte: new Date(d.setHours(23, 59, 59, 999))
      };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('student', 'fullName class grNo rollNo')
        .populate('teacher', 'fullName empCode')
        .populate('markedBy', 'username fullName')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: records,
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total, 
        totalPages: Math.ceil(total / limit) 
      }
    });
  } catch (error) {
    await logError(error, { context: 'getAttendance' });
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
};

// @desc    Get Attendance for a Specific Date (for marking UI)
// @route   GET /api/attendance/date/:date
exports.getAttendanceForDate = async (req, res) => {
  try {
    const { date } = req.params;
    const { type, className } = req.query;

    if (!type) return res.status(400).json({ success: false, error: 'Type is required' });

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    let people = [];
    let existingAttendance = [];

    if (type === 'student') {
      const studentFilter = { status: 'Active' };
      if (className) studentFilter.class = className;
      
      people = await Student.find(studentFilter)
        .select('fullName class grNo rollNo')
        .sort({ rollNo: 1, fullName: 1 });

      existingAttendance = await Attendance.find({
        type: 'student',
        date: { $gte: startOfDay, $lte: endOfDay },
        student: { $in: people.map(p => p._id) }
      }).populate('student', 'fullName');
    } else if (type === 'teacher') {
      people = await Teacher.find({ status: 'Active' })
        .select('fullName empCode subjects')
        .sort({ fullName: 1 });

      existingAttendance = await Attendance.find({
        type: 'teacher',
        date: { $gte: startOfDay, $lte: endOfDay },
        teacher: { $in: people.map(p => p._id) }
      }).populate('teacher', 'fullName');
    }

    // Merge people with their attendance status
    const mergedData = people.map(person => {
      const personId = type === 'student' ? person._id : person._id;
      const attendance = existingAttendance.find(a => {
        const aPersonId = type === 'student' ? a.student?._id?.toString() : a.teacher?._id?.toString();
        return aPersonId === personId.toString();
      });

      return {
        personId: person._id,
        name: person.fullName,
        identifier: type === 'student' ? (person.rollNo || person.grNo || 'N/A') : (person.empCode || 'N/A'),
        class: type === 'student' ? person.class : null,
        status: attendance?.status || null,
        remarks: attendance?.remarks || '',
        marked: !!attendance
      };
    });

    res.status(200).json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        type,
        className: className || null,
        records: mergedData,
        summary: {
          total: mergedData.length,
          present: mergedData.filter(r => r.status === 'Present').length,
          absent: mergedData.filter(r => r.status === 'Absent').length,
          late: mergedData.filter(r => r.status === 'Late').length,
          leave: mergedData.filter(r => r.status === 'Leave').length,
          unmarked: mergedData.filter(r => !r.status).length
        }
      }
    });
  } catch (error) {
    await logError(error, { context: 'getAttendanceForDate' });
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
};

// @desc    Get Attendance Report (Monthly/Class-wise statistics)
// @route   GET /api/attendance/report
exports.getAttendanceReport = async (req, res) => {
  try {
    const { type, className, month, year } = req.query;
    
    if (!type) return res.status(400).json({ success: false, error: 'Type is required' });

    const targetMonth = parseInt(month) || new Date().getMonth();
    const targetYear = parseInt(year) || new Date().getFullYear();
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const filter = {
      type,
      date: { $gte: startDate, $lte: endDate }
    };
    if (className && type === 'student') filter.className = className;

    const records = await Attendance.find(filter)
      .populate(type === 'student' ? 'student' : 'teacher', 'fullName class');

    // Group by person
    const personStats = {};
    records.forEach(r => {
      const personId = type === 'student' ? r.student?._id?.toString() : r.teacher?._id?.toString();
      const personName = type === 'student' ? r.student?.fullName : r.teacher?.fullName;
      
      if (!personId) return;

      if (!personStats[personId]) {
        personStats[personId] = {
          personId,
          name: personName || 'Unknown',
          class: type === 'student' ? r.student?.class : null,
          Present: 0,
          Absent: 0,
          Late: 0,
          Leave: 0,
          total: 0
        };
      }

      personStats[personId][r.status]++;
      personStats[personId].total++;
    });

    // Calculate percentages
    const report = Object.values(personStats).map(p => {
      const percentage = p.total > 0 ? ((p.Present + p.Late) / p.total) * 100 : 0;
      return {
        ...p,
        percentage: parseFloat(percentage.toFixed(2))
      };
    });

    // Sort by name
    report.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      data: {
        type,
        className: className || null,
        month: targetMonth,
        year: targetYear,
        monthName: startDate.toLocaleString('default', { month: 'long' }),
        report,
        summary: {
          totalPeople: report.length,
          totalRecords: records.length,
          avgPercentage: report.length > 0 
            ? parseFloat((report.reduce((sum, p) => sum + p.percentage, 0) / report.length).toFixed(2))
            : 0
        }
      }
    });
  } catch (error) {
    await logError(error, { context: 'getAttendanceReport' });
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
};

// @desc    Delete Attendance Record
// @route   DELETE /api/attendance/:id
exports.deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, error: 'Record not found' });

    await logAudit('ATTENDANCE_DELETED', {
      userId: req.user.id,
      attendanceId: record._id,
      type: record.type,
      date: record.date
    });

    res.status(200).json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    await logError(error, { context: 'deleteAttendance' });
    res.status(500).json({ success: false, error: 'Failed to delete attendance' });
  }
};

// @desc    Get Available Classes (for filter dropdown)
// @route   GET /api/attendance/classes
exports.getAttendanceClasses = async (req, res) => {
  try {
    const students = await Student.find({ status: 'Active' }).distinct('class');
    res.status(200).json({ success: true, data: students.sort() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch classes' });
  }
};