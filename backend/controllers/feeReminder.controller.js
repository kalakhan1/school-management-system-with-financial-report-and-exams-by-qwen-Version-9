const Student = require('../models/Student');
const FeeHistory = require('../models/FeeHistory');

// @desc    Get Students with Outstanding Fees
exports.getOutstandingStudents = async (req, res) => {
  try {
    const students = await Student.find({ status: 'Active' }).lean();
    const outstandingList = [];

    for (const student of students) {
      const netFee = (student.fee || 0) - (student.discount || 0);
      if (netFee <= 0) continue;

      const payments = await FeeHistory.find({ student: student._id });
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const outstanding = netFee - totalPaid;

      if (outstanding > 0) {
        outstandingList.push({
          student: { _id: student._id, fullName: student.fullName, class: student.class, phone: student.phone },
          feeData: { netFee, totalPaid, outstanding }
        });
      }
    }

    res.status(200).json({ success: true, data: outstandingList });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch outstanding students' });
  }
};