const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const FeeHistory = require('../models/FeeHistory');
const Expense = require('../models/Expense');
const SalaryHistory = require('../models/SalaryHistory');
const AuditLog = require('../models/AuditLog');
const Archive = require('../models/Archive');

// @desc    Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Parallel queries for performance
    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      totalClasses,
      monthFees,
      monthExpenses,
      monthSalaries,
      recentActivities,
      trashCount
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'Active' }),
      Teacher.countDocuments(),
      Teacher.countDocuments({ status: 'Active' }),
      Class.countDocuments(),
      FeeHistory.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }).select('amount'),
      Expense.find({ date: { $gte: startOfMonth, $lte: endOfMonth } }).select('amount'),
      SalaryHistory.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }).select('amount'),
      AuditLog.find().populate('userId', 'username fullName').sort({ createdAt: -1 }).limit(10),
      Archive.countDocuments()
    ]);

    // Calculate totals
    const feesCollected = monthFees.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalSalaries = monthSalaries.reduce((sum, s) => sum + (s.amount || 0), 0);
    const netThisMonth = feesCollected - (totalExpenses + totalSalaries);

    // Calculate outstanding fees
    const students = await Student.find({ status: 'Active' }).select('fee discount');
    let totalOutstanding = 0;
    for (const student of students) {
      const netFee = (student.fee || 0) - (student.discount || 0);
      if (netFee <= 0) continue;
      const paid = await FeeHistory.find({ student: student._id }).select('amount');
      const totalPaid = paid.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (totalPaid < netFee) totalOutstanding += (netFee - totalPaid);
    }

    // Monthly fee collection chart data (last 6 months)
    const monthlyChartData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthFees = await FeeHistory.find({ createdAt: { $gte: monthStart, $lte: monthEnd } }).select('amount');
      const total = monthFees.reduce((sum, f) => sum + (f.amount || 0), 0);
      monthlyChartData.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        amount: total
      });
    }

    res.status(200).json({
      success: true,
      data: {
        students: { total: totalStudents, active: activeStudents },
        teachers: { total: totalTeachers, active: activeTeachers },
        classes: totalClasses,
        finance: {
          feesCollectedThisMonth: feesCollected,
          expensesThisMonth: totalExpenses,
          salariesThisMonth: totalSalaries,
          netThisMonth,
          totalOutstanding
        },
        recentActivities,
        trashCount,
        monthlyChartData
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
};