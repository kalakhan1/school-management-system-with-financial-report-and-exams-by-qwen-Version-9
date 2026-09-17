const FeeHistory = require('../models/FeeHistory');
const Expense = require('../models/Expense');
const SalaryHistory = require('../models/SalaryHistory');

// @desc    Get Financial Summary
exports.getFinancialSummary = async (req, res) => {
  try {
    const { year } = req.query;
    const yearNum = parseInt(year) || new Date().getFullYear();
    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31, 23, 59, 59);

    const [fees, expenses, salaries] = await Promise.all([
      FeeHistory.find({ createdAt: { $gte: startDate, $lte: endDate } }),
      Expense.find({ date: { $gte: startDate, $lte: endDate } }),
      SalaryHistory.find({ createdAt: { $gte: startDate, $lte: endDate } })
    ]);

    const totalIncome = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalSalaries = salaries.reduce((sum, s) => sum + (s.amount || 0), 0);
    const netProfit = totalIncome - (totalExpenses + totalSalaries);

    // Monthly breakdown
    const monthlyData = {};
    for (let i = 0; i < 12; i++) {
      const monthName = new Date(yearNum, i).toLocaleString('default', { month: 'short' });
      monthlyData[monthName] = { income: 0, expenses: 0, salaries: 0 };
    }

    fees.forEach(f => {
      const month = new Date(f.createdAt).toLocaleString('default', { month: 'short' });
      if (monthlyData[month]) monthlyData[month].income += f.amount || 0;
    });
    expenses.forEach(e => {
      const month = new Date(e.date).toLocaleString('default', { month: 'short' });
      if (monthlyData[month]) monthlyData[month].expenses += e.amount || 0;
    });
    salaries.forEach(s => {
      const month = new Date(s.createdAt).toLocaleString('default', { month: 'short' });
      if (monthlyData[month]) monthlyData[month].salaries += s.amount || 0;
    });

    res.status(200).json({
      success: true,
      data: {
        year: yearNum,
        totalIncome, totalExpenses, totalSalaries, netProfit,
        monthlyData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch financial report' });
  }
};