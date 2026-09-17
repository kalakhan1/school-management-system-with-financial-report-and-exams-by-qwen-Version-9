const FeeHistory = require('../models/FeeHistory');
const Expense = require('../models/Expense');
const SalaryHistory = require('../models/SalaryHistory');
const { logError } = require('../utils/logger');

// @desc    Get Financial Summary (with date range support)
// @route   GET /api/financial-reports/summary
exports.getFinancialSummary = async (req, res) => {
  try {
    const { year, startDate, endDate, period } = req.query;
    
    let filterStartDate, filterEndDate, periodLabel;

    // ✅ NEW: Handle different filter types
    if (startDate && endDate) {
      // Custom date range
      filterStartDate = new Date(startDate);
      filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999);
      periodLabel = `${filterStartDate.toLocaleDateString()} - ${filterEndDate.toLocaleDateString()}`;
    } else if (period === 'day') {
      // Single day
      const targetDate = year ? new Date(year) : new Date();
      filterStartDate = new Date(targetDate.setHours(0, 0, 0, 0));
      filterEndDate = new Date(targetDate.setHours(23, 59, 59, 999));
      periodLabel = filterStartDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (period === 'week') {
      // Current week (Sunday to Saturday)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      filterStartDate = new Date(now);
      filterStartDate.setDate(now.getDate() - dayOfWeek);
      filterStartDate.setHours(0, 0, 0, 0);
      filterEndDate = new Date(filterStartDate);
      filterEndDate.setDate(filterStartDate.getDate() + 6);
      filterEndDate.setHours(23, 59, 59, 999);
      periodLabel = `Week of ${filterStartDate.toLocaleDateString()} - ${filterEndDate.toLocaleDateString()}`;
    } else if (period === 'month') {
      // Specific month
      const targetDate = year ? new Date(year) : new Date();
      const month = targetDate.getMonth();
      const yearNum = targetDate.getFullYear();
      filterStartDate = new Date(yearNum, month, 1);
      filterEndDate = new Date(yearNum, month + 1, 0, 23, 59, 59, 999);
      periodLabel = filterStartDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else {
      // Default: Full year
      const yearNum = parseInt(year) || new Date().getFullYear();
      filterStartDate = new Date(yearNum, 0, 1);
      filterEndDate = new Date(yearNum, 11, 31, 23, 59, 59);
      periodLabel = `Year ${yearNum}`;
    }

    // Fetch data within date range
    const [fees, expenses, salaries] = await Promise.all([
      FeeHistory.find({ 
        createdAt: { $gte: filterStartDate, $lte: filterEndDate } 
      }).populate('student', 'fullName class').lean(),
      Expense.find({ 
        date: { $gte: filterStartDate, $lte: filterEndDate } 
      }).lean(),
      SalaryHistory.find({ 
        createdAt: { $gte: filterStartDate, $lte: filterEndDate } 
      }).populate('teacher', 'fullName').lean()
    ]);

    // Calculate totals
    const totalIncome = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalSalaries = salaries.reduce((sum, s) => sum + (s.amount || 0), 0);
    const netProfit = totalIncome - (totalExpenses + totalSalaries);

    // ✅ NEW: Category-wise breakdown for expenses
    const expenseByCategory = {};
    expenses.forEach(e => {
      const cat = e.category || 'Uncategorized';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (e.amount || 0);
    });

    // ✅ NEW: Payment method breakdown for fees
    const feeByMethod = {};
    fees.forEach(f => {
      const method = f.paymentMethod || 'Cash';
      feeByMethod[method] = (feeByMethod[method] || 0) + (f.amount || 0);
    });

    // ✅ NEW: Monthly breakdown (only for year/longer periods)
    const monthlyData = {};
    const isLongPeriod = (filterEndDate - filterStartDate) > (30 * 24 * 60 * 60 * 1000);
    
    if (isLongPeriod) {
      const startMonth = new Date(filterStartDate.getFullYear(), filterStartDate.getMonth(), 1);
      const endMonth = new Date(filterEndDate.getFullYear(), filterEndDate.getMonth(), 1);
      
      let currentMonth = new Date(startMonth);
      while (currentMonth <= endMonth) {
        const monthName = currentMonth.toLocaleString('default', { month: 'short' });
        monthlyData[monthName] = { income: 0, expenses: 0, salaries: 0 };
        currentMonth.setMonth(currentMonth.getMonth() + 1);
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
    }

    // ✅ NEW: Daily breakdown (for day/week/month periods)
    const dailyData = [];
    const isShortPeriod = (filterEndDate - filterStartDate) <= (31 * 24 * 60 * 60 * 1000);
    
    if (isShortPeriod) {
      let currentDate = new Date(filterStartDate);
      while (currentDate <= filterEndDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayIncome = fees.filter(f => {
          const fDate = new Date(f.createdAt);
          return fDate >= currentDate && fDate < nextDate;
        }).reduce((sum, f) => sum + (f.amount || 0), 0);
        
        const dayExpenses = expenses.filter(e => {
          const eDate = new Date(e.date);
          return eDate >= currentDate && eDate < nextDate;
        }).reduce((sum, e) => sum + (e.amount || 0), 0);
        
        const daySalaries = salaries.filter(s => {
          const sDate = new Date(s.createdAt);
          return sDate >= currentDate && sDate < nextDate;
        }).reduce((sum, s) => sum + (s.amount || 0), 0);
        
        dailyData.push({
          date: dateStr,
          income: dayIncome,
          expenses: dayExpenses,
          salaries: daySalaries,
          net: dayIncome - dayExpenses - daySalaries
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // ✅ NEW: Detailed transactions list (for print)
    const allTransactions = [
      ...fees.map(f => ({
        type: 'Income',
        date: f.createdAt,
        description: `Fee from ${f.student?.fullName || 'Unknown'} (${f.student?.class || 'N/A'}) - ${f.month || ''}`,
        category: f.paymentMethod || 'Cash',
        amount: f.amount || 0
      })),
      ...expenses.map(e => ({
        type: 'Expense',
        date: e.date,
        description: e.description || e.category || 'Expense',
        category: e.category || 'Uncategorized',
        amount: e.amount || 0
      })),
      ...salaries.map(s => ({
        type: 'Salary',
        date: s.createdAt,
        description: `Salary to ${s.teacher?.fullName || 'Unknown'} - ${s.month || ''}`,
        category: s.paymentMethod || 'Bank Transfer',
        amount: s.amount || 0
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: {
        period: periodLabel,
        startDate: filterStartDate,
        endDate: filterEndDate,
        totalIncome, 
        totalExpenses, 
        totalSalaries, 
        netProfit,
        monthlyData,
        dailyData,
        expenseByCategory,
        feeByMethod,
        transactions: allTransactions,
        summary: {
          totalTransactions: allTransactions.length,
          incomeTransactions: fees.length,
          expenseTransactions: expenses.length,
          salaryTransactions: salaries.length,
          averageDailyIncome: isShortPeriod && dailyData.length > 0 
            ? dailyData.reduce((sum, d) => sum + d.income, 0) / dailyData.length 
            : 0,
          averageDailyExpense: isShortPeriod && dailyData.length > 0
            ? dailyData.reduce((sum, d) => sum + d.expenses, 0) / dailyData.length
            : 0
        }
      }
    });
  } catch (error) {
    await logError(error, { context: 'getFinancialSummary' });
    res.status(500).json({ success: false, error: 'Failed to fetch financial report: ' + error.message });
  }
};