const ResultCard = require('../models/ResultCard');
const ExamRegistration = require('../models/ExamRegistration');
const Student = require('../models/Student');
const Setting = require('../models/Setting');

// @desc    Get Class-wise Result Report
// @route   GET /api/class-results/report
exports.getClassReport = async (req, res) => {
  try {
    const { className, examType, examYear } = req.query;

    if (!className || !examType || !examYear) {
      return res.status(400).json({ 
        success: false, 
        error: 'Class name, exam type, and year are required' 
      });
    }

    // 1. Get all active students of this class
    const students = await Student.find({ 
      class: className, 
      status: 'Active' 
    }).select('fullName grNo rollNo section').sort({ rollNo: 1, fullName: 1 });

    if (students.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: { students: [], subjects: [], summary: {}, topToppers: [] },
        message: 'No students found in this class'
      });
    }

    const studentIds = students.map(s => s._id);

    // ✅ FIX: Pehle matching registrations dhoondo (populate ke pehle filter nahi hota)
    const registrations = await ExamRegistration.find({
      student: { $in: studentIds },
      examType: examType,
      examYear: parseInt(examYear)
    }).select('_id student rollNumber');

    const registrationIds = registrations.map(r => r._id);
    
    // Map student ID to registration for quick lookup
    const registrationMap = {};
    registrations.forEach(r => {
      registrationMap[r.student.toString()] = r;
    });

    // ✅ FIX: Ab result cards fetch karo matching registrations ke liye
    const results = await ResultCard.find({
      registration: { $in: registrationIds }
    }).populate('student', 'fullName grNo rollNo section')
      .populate('registration', 'examType examYear rollNumber');

    // 3. Extract all unique subjects from results
    const subjectsSet = new Set();
    results.forEach(r => {
      (r.subjectMarks || []).forEach(sm => subjectsSet.add(sm.subject));
    });
    const subjects = Array.from(subjectsSet);

    // 4. Build student-wise result data
    const studentsData = students.map(student => {
      const result = results.find(r => r.student._id.toString() === student._id.toString());
      const registration = registrationMap[student._id.toString()];
      
      if (!result) {
        return {
          student: {
            _id: student._id,
            fullName: student.fullName,
            grNo: student.grNo,
            rollNo: student.rollNo || (registration?.rollNumber) || 'N/A',
            section: student.section
          },
          subjectMarks: {},
          totalMarks: 0,
          totalMax: 0,
          percentage: 0,
          grade: 'N/A',
          status: 'Result Not Generated'
        };
      }

      // Build subject-wise marks object
      const subjectMarks = {};
      let totalObtained = 0;
      let totalMax = 0;
      
      (result.subjectMarks || []).forEach(sm => {
        subjectMarks[sm.subject] = {
          obtained: sm.obtained,
          total: sm.total
        };
        totalObtained += sm.obtained;
        totalMax += sm.total;
      });

      const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

      return {
        student: {
          _id: student._id,
          fullName: student.fullName,
          grNo: student.grNo,
          rollNo: student.rollNo || result.registration?.rollNumber || 'N/A',
          section: student.section
        },
        subjectMarks,
        totalMarks: totalObtained,
        totalMax,
        percentage: parseFloat(percentage.toFixed(2)),
        grade: result.grade || 'N/A',
        status: percentage >= 40 ? 'PASS' : 'FAIL'
      };
    });

    // 5. ✅ NEW: Calculate Top 10 Toppers
    const studentsWithResults = studentsData
      .filter(s => s.status !== 'Result Not Generated' && s.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);
    
    const topToppers = studentsWithResults.slice(0, 10).map((s, index) => ({
      rank: index + 1,
      student: s.student,
      percentage: s.percentage,
      grade: s.grade,
      totalMarks: s.totalMarks,
      totalMax: s.totalMax
    }));

    // 6. Calculate summary statistics
    const passCount = studentsWithResults.filter(s => s.status === 'PASS').length;
    const failCount = studentsWithResults.filter(s => s.status === 'FAIL').length;
    const noResultCount = studentsData.filter(s => s.status === 'Result Not Generated').length;
    
    const avgPercentage = studentsWithResults.length > 0
      ? studentsWithResults.reduce((sum, s) => sum + s.percentage, 0) / studentsWithResults.length
      : 0;

    const highestPercentage = studentsWithResults.length > 0 ? studentsWithResults[0].percentage : 0;
    const lowestPercentage = studentsWithResults.length > 0 
      ? studentsWithResults[studentsWithResults.length - 1].percentage 
      : 0;

    // 7. Get school settings for print
    const settings = await Setting.findOne().lean() || {};

    res.status(200).json({
      success: true,
      data: {
        students: studentsData,
        subjects,
        topToppers, // ✅ NEW
        summary: {
          totalStudents: students.length,
          appeared: studentsWithResults.length,
          passed: passCount,
          failed: failCount,
          noResult: noResultCount,
          classAverage: parseFloat(avgPercentage.toFixed(2)),
          passPercentage: studentsWithResults.length > 0 
            ? parseFloat(((passCount / studentsWithResults.length) * 100).toFixed(2))
            : 0,
          highestPercentage: parseFloat(highestPercentage.toFixed(2)),
          lowestPercentage: parseFloat(lowestPercentage.toFixed(2))
        },
        school: {
          name: settings.schoolName || 'School Name',
          address: settings.schoolAddress || '',
          phone: settings.schoolPhone || '',
          academicYear: settings.academicYear || new Date().getFullYear().toString()
        },
        examInfo: {
          examType,
          examYear: parseInt(examYear),
          className
        }
      }
    });
  } catch (error) {
    console.error('Class Report Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate class report: ' + error.message });
  }
};

// @desc    Get List of Classes that have results
// @route   GET /api/class-results/classes-with-results
exports.getClassesWithResults = async (req, res) => {
  try {
    const results = await ResultCard.find()
      .populate('student', 'class')
      .select('student')
      .lean();

    const classesSet = new Set();
    results.forEach(r => {
      if (r.student?.class) classesSet.add(r.student.class);
    });

    res.status(200).json({ 
      success: true, 
      data: Array.from(classesSet).sort() 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch classes' });
  }
};