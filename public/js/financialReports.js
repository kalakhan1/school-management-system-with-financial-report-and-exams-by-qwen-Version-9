// ==========================================
// FINANCIAL REPORTS (Advanced Filters + Multi-Page Print)
// ==========================================

// Global filter state
let financialFilters = {
  period: 'year',     // day, week, month, year, custom
  year: new Date().getFullYear(),
  startDate: '',
  endDate: ''
};

async function loadFinancialReports() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Financial Reports';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    main.innerHTML = `
      <!-- Filter Section -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-white">
          <h5 class="mb-0"><i class="bi bi-funnel"></i> Report Filters</h5>
        </div>
        <div class="card-body">
          <!-- Period Selection Buttons -->
          <div class="mb-3">
            <label class="form-label fw-bold">Select Period</label>
            <div class="btn-group w-100" role="group">
              <button type="button" class="btn btn-outline-primary period-btn ${financialFilters.period === 'day' ? 'active' : ''}" 
                      onclick="setFinancialPeriod('day')">
                <i class="bi bi-calendar-day"></i> Day
              </button>
              <button type="button" class="btn btn-outline-primary period-btn ${financialFilters.period === 'week' ? 'active' : ''}" 
                      onclick="setFinancialPeriod('week')">
                <i class="bi bi-calendar-week"></i> Week
              </button>
              <button type="button" class="btn btn-outline-primary period-btn ${financialFilters.period === 'month' ? 'active' : ''}" 
                      onclick="setFinancialPeriod('month')">
                <i class="bi bi-calendar-month"></i> Month
              </button>
              <button type="button" class="btn btn-outline-primary period-btn ${financialFilters.period === 'year' ? 'active' : ''}" 
                      onclick="setFinancialPeriod('year')">
                <i class="bi bi-calendar-range"></i> Year
              </button>
              <button type="button" class="btn btn-outline-primary period-btn ${financialFilters.period === 'custom' ? 'active' : ''}" 
                      onclick="setFinancialPeriod('custom')">
                <i class="bi bi-calendar3"></i> Custom
              </button>
            </div>
          </div>

          <!-- Dynamic Filter Inputs -->
          <div id="financialFilterInputs" class="row g-3">
            <!-- Will be populated by setFinancialPeriod -->
          </div>

          <!-- Action Buttons -->
          <div class="row g-2 mt-2">
            <div class="col-md-6">
              <button class="btn btn-primary w-100" onclick="generateFinancialReport()">
                <i class="bi bi-search"></i> Generate Report
              </button>
            </div>
            <div class="col-md-6">
              <button class="btn btn-outline-secondary w-100" onclick="resetFinancialFilters()">
                <i class="bi bi-arrow-counterclockwise"></i> Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Container -->
      <div id="financialReportContainer">
        <div class="text-center text-muted p-5">
          <i class="bi bi-graph-up" style="font-size: 3rem;"></i>
          <h5 class="mt-3">Select a period and click "Generate Report"</h5>
        </div>
      </div>
    `;

    // Initialize with current period
    setFinancialPeriod(financialFilters.period);
  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger">Failed to load: ${err.message}</div>`;
  }
}

// ✅ NEW: Set period and show appropriate inputs
function setFinancialPeriod(period) {
  financialFilters.period = period;
  
  // Update button states
  document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
  event?.target?.closest('.period-btn')?.classList.add('active');

  const inputsContainer = document.getElementById('financialFilterInputs');
  let html = '';

  switch (period) {
    case 'day':
      html = `
        <div class="col-md-6">
          <label class="form-label fw-bold">Select Date</label>
          <input type="date" id="finDayDate" class="form-control" 
                 value="${new Date().toISOString().split('T')[0]}">
        </div>
      `;
      break;
    
    case 'week':
      html = `
        <div class="col-md-6">
          <label class="form-label fw-bold">Week Starting From</label>
          <input type="date" id="finWeekStart" class="form-control" 
                 value="${getWeekStartDate()}">
          <small class="text-muted">Week will be calculated from this date (7 days)</small>
        </div>
      `;
      break;
    
    case 'month':
      const currentMonth = new Date().getMonth();
      const months = Array.from({ length: 12 }, (_, i) => 
        `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>`
      ).join('');
      
      html = `
        <div class="col-md-6">
          <label class="form-label fw-bold">Select Month</label>
          <select id="finMonth" class="form-select">${months}</select>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">Select Year</label>
          <input type="number" id="finMonthYear" class="form-control" 
                 value="${new Date().getFullYear()}" min="2000" max="2100">
        </div>
      `;
      break;
    
    case 'year':
      html = `
        <div class="col-md-6">
          <label class="form-label fw-bold">Select Year</label>
          <input type="number" id="finYear" class="form-control" 
                 value="${new Date().getFullYear()}" min="2000" max="2100">
        </div>
      `;
      break;
    
    case 'custom':
      html = `
        <div class="col-md-6">
          <label class="form-label fw-bold">Start Date *</label>
          <input type="date" id="finStartDate" class="form-control" 
                 value="${financialFilters.startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0]}">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">End Date *</label>
          <input type="date" id="finEndDate" class="form-control" 
                 value="${financialFilters.endDate || new Date().toISOString().split('T')[0]}">
        </div>
      `;
      break;
  }

  inputsContainer.innerHTML = html;
}

// ✅ NEW: Helper to get current week's start date (Sunday)
function getWeekStartDate() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  const sunday = new Date(now.setDate(diff));
  return sunday.toISOString().split('T')[0];
}

// ✅ NEW: Reset filters
function resetFinancialFilters() {
  financialFilters = {
    period: 'year',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: ''
  };
  setFinancialPeriod('year');
  document.getElementById('financialReportContainer').innerHTML = `
    <div class="text-center text-muted p-5">
      <i class="bi bi-graph-up" style="font-size: 3rem;"></i>
      <h5 class="mt-3">Select a period and click "Generate Report"</h5>
    </div>
  `;
}

// ✅ NEW: Generate report with current filters
async function generateFinancialReport() {
  const container = document.getElementById('financialReportContainer');
  container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div><p class="mt-3">Generating report...</p></div>';

  let queryParams = '';

  try {
    switch (financialFilters.period) {
      case 'day':
        const dayDate = document.getElementById('finDayDate')?.value;
        if (!dayDate) return showToast('Please select a date', 'warning');
        queryParams = `period=day&year=${dayDate}`;
        break;
      
      case 'week':
        const weekStart = document.getElementById('finWeekStart')?.value;
        if (!weekStart) return showToast('Please select week start date', 'warning');
        const weekEndDate = new Date(weekStart);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        queryParams = `startDate=${weekStart}&endDate=${weekEndDate.toISOString().split('T')[0]}`;
        break;
      
      case 'month':
        const month = document.getElementById('finMonth')?.value;
        const monthYear = document.getElementById('finMonthYear')?.value;
        if (month === undefined || !monthYear) return showToast('Please select month and year', 'warning');
        const monthDate = new Date(parseInt(monthYear), parseInt(month), 1);
        queryParams = `period=month&year=${monthDate.toISOString()}`;
        break;
      
      case 'year':
        const year = document.getElementById('finYear')?.value;
        if (!year) return showToast('Please select a year', 'warning');
        queryParams = `year=${year}`;
        break;
      
      case 'custom':
        const startDate = document.getElementById('finStartDate')?.value;
        const endDate = document.getElementById('finEndDate')?.value;
        if (!startDate || !endDate) return showToast('Please select both dates', 'warning');
        if (new Date(startDate) > new Date(endDate)) {
          return showToast('Start date cannot be after end date', 'warning');
        }
        financialFilters.startDate = startDate;
        financialFilters.endDate = endDate;
        queryParams = `startDate=${startDate}&endDate=${endDate}`;
        break;
    }

    const res = await api.get(`/financial-reports/summary?${queryParams}`);
    const data = res.data;

    // Store for printing
    window.currentFinancialReport = data;

    renderFinancialReport(data);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to generate report: ${err.message}</div>`;
  }
}

// ✅ NEW: Render financial report
function renderFinancialReport(data) {
  const container = document.getElementById('financialReportContainer');

  // Summary cards
  const summaryCards = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card shadow-sm border-success h-100">
          <div class="card-body text-center">
            <i class="bi bi-cash-stack text-success" style="font-size: 2rem;"></i>
            <h6 class="text-muted mt-2">Total Income</h6>
            <h3 class="text-success mb-0">Rs. ${data.totalIncome.toLocaleString()}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card shadow-sm border-danger h-100">
          <div class="card-body text-center">
            <i class="bi bi-receipt text-danger" style="font-size: 2rem;"></i>
            <h6 class="text-muted mt-2">Total Expenses</h6>
            <h3 class="text-danger mb-0">Rs. ${data.totalExpenses.toLocaleString()}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card shadow-sm border-warning h-100">
          <div class="card-body text-center">
            <i class="bi bi-wallet2 text-warning" style="font-size: 2rem;"></i>
            <h6 class="text-muted mt-2">Total Salaries</h6>
            <h3 class="text-warning mb-0">Rs. ${data.totalSalaries.toLocaleString()}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card shadow-sm h-100 ${data.netProfit >= 0 ? 'border-success' : 'border-danger'}">
          <div class="card-body text-center">
            <i class="bi bi-graph-up-arrow ${data.netProfit >= 0 ? 'text-success' : 'text-danger'}" style="font-size: 2rem;"></i>
            <h6 class="text-muted mt-2">Net Profit/Loss</h6>
            <h3 class="${data.netProfit >= 0 ? 'text-success' : 'text-danger'} mb-0">Rs. ${data.netProfit.toLocaleString()}</h3>
          </div>
        </div>
      </div>
    </div>
  `;

  // Action buttons
  const actions = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">
        <i class="bi bi-calendar-check"></i> ${data.period}
      </h5>
      <div>
        <button class="btn btn-success me-2" onclick="printFinancialReport()">
          <i class="bi bi-printer"></i> Print Full Report
        </button>
        <button class="btn btn-outline-info" onclick="printFinancialSummary()">
          <i class="bi bi-file-earmark-text"></i> Print Summary
        </button>
      </div>
    </div>
  `;

  // Expense by category breakdown
  const categoryRows = Object.entries(data.expenseByCategory || {}).map(([cat, amt]) => `
    <tr>
      <td><span class="badge bg-secondary">${cat}</span></td>
      <td class="text-end"><strong class="text-danger">Rs. ${amt.toLocaleString()}</strong></td>
      <td class="text-end">${data.totalExpenses > 0 ? ((amt / data.totalExpenses) * 100).toFixed(1) : 0}%</td>
    </tr>
  `).join('');

  const categorySection = `
    <div class="card shadow-sm mb-4">
      <div class="card-header bg-white"><h6 class="mb-0"><i class="bi bi-pie-chart"></i> Expense Breakdown by Category</h6></div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Category</th><th class="text-end">Amount</th><th class="text-end">Percentage</th></tr></thead>
          <tbody>${categoryRows || '<tr><td colspan="3" class="text-center text-muted">No expenses</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;

  // Monthly/Daily breakdown
  let breakdownSection = '';
  if (data.monthlyData && Object.keys(data.monthlyData).length > 0) {
    const monthlyRows = Object.entries(data.monthlyData).map(([month, d]) => `
      <tr>
        <td><strong>${month}</strong></td>
        <td class="text-end text-success">Rs. ${d.income.toLocaleString()}</td>
        <td class="text-end text-danger">Rs. ${d.expenses.toLocaleString()}</td>
        <td class="text-end text-warning">Rs. ${d.salaries.toLocaleString()}</td>
        <td class="text-end ${d.income - d.expenses - d.salaries >= 0 ? 'text-success' : 'text-danger'} fw-bold">
          Rs. ${(d.income - d.expenses - d.salaries).toLocaleString()}
        </td>
      </tr>
    `).join('');

    breakdownSection = `
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-white"><h6 class="mb-0"><i class="bi bi-calendar-month"></i> Monthly Breakdown</h6></div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-dark"><tr><th>Month</th><th class="text-end">Income</th><th class="text-end">Expenses</th><th class="text-end">Salaries</th><th class="text-end">Net</th></tr></thead>
            <tbody>${monthlyRows}</tbody>
          </table>
        </div>
      </div>
    `;
  } else if (data.dailyData && data.dailyData.length > 0) {
    const dailyRows = data.dailyData.map(d => `
      <tr>
        <td>${new Date(d.date).toLocaleDateString()}</td>
        <td class="text-end text-success">Rs. ${d.income.toLocaleString()}</td>
        <td class="text-end text-danger">Rs. ${d.expenses.toLocaleString()}</td>
        <td class="text-end text-warning">Rs. ${d.salaries.toLocaleString()}</td>
        <td class="text-end ${d.net >= 0 ? 'text-success' : 'text-danger'} fw-bold">Rs. ${d.net.toLocaleString()}</td>
      </tr>
    `).join('');

    breakdownSection = `
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-white"><h6 class="mb-0"><i class="bi bi-calendar-day"></i> Daily Breakdown</h6></div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-dark"><tr><th>Date</th><th class="text-end">Income</th><th class="text-end">Expenses</th><th class="text-end">Salaries</th><th class="text-end">Net</th></tr></thead>
            <tbody>${dailyRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Quick stats
  const quickStats = `
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h6 class="text-muted">Total Transactions</h6>
            <h4>${data.summary.totalTransactions}</h4>
            <small class="text-muted">Income: ${data.summary.incomeTransactions} | Expense: ${data.summary.expenseTransactions} | Salary: ${data.summary.salaryTransactions}</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h6 class="text-muted">Avg Daily Income</h6>
            <h4 class="text-success">Rs. ${Math.round(data.summary.averageDailyIncome).toLocaleString()}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h6 class="text-muted">Avg Daily Expense</h6>
            <h4 class="text-danger">Rs. ${Math.round(data.summary.averageDailyExpense).toLocaleString()}</h4>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = summaryCards + actions + quickStats + categorySection + breakdownSection;
}

// ==========================================
// ✅ PRINT FULL REPORT (Multi-Page)
// ==========================================
function printFinancialReport() {
  const data = window.currentFinancialReport;
  if (!data) return showToast('Generate report first', 'warning');

  const printWindow = window.open('', '_blank', 'width=1000,height=700');
  if (!printWindow) return showToast('Popup blocked!', 'warning');

  // ✅ Split transactions into chunks for multi-page (30 per page)
  const transactionsPerPage = 30;
  const transactions = data.transactions || [];
  const totalPages = Math.max(1, Math.ceil(transactions.length / transactionsPerPage));
  
  let pagesHtml = '';
  
  for (let page = 0; page < totalPages; page++) {
    const startIdx = page * transactionsPerPage;
    const endIdx = Math.min(startIdx + transactionsPerPage, transactions.length);
    const pageTransactions = transactions.slice(startIdx, endIdx);
    
    const transRows = pageTransactions.map((t, idx) => {
      const actualIdx = startIdx + idx;
      const typeClass = t.type === 'Income' ? 'success' : t.type === 'Expense' ? 'danger' : 'warning';
      return `
        <tr>
          <td class="center">${actualIdx + 1}</td>
          <td>${new Date(t.date).toLocaleDateString()}</td>
          <td><span class="type-badge type-${typeClass}">${t.type}</span></td>
          <td>${t.description}</td>
          <td>${t.category}</td>
          <td class="center amount-${typeClass}"><strong>Rs. ${t.amount.toLocaleString()}</strong></td>
        </tr>
      `;
    }).join('');

    // ✅ Summary section only on last page
    let summarySection = '';
    if (page === totalPages - 1) {
      // Category breakdown
      const categoryRows = Object.entries(data.expenseByCategory || {}).map(([cat, amt]) => `
        <tr>
          <td>${cat}</td>
          <td class="center">Rs. ${amt.toLocaleString()}</td>
          <td class="center">${data.totalExpenses > 0 ? ((amt / data.totalExpenses) * 100).toFixed(1) : 0}%</td>
        </tr>
      `).join('');

      // Monthly/Daily breakdown
      let breakdownTable = '';
      if (data.monthlyData && Object.keys(data.monthlyData).length > 0) {
        const rows = Object.entries(data.monthlyData).map(([month, d]) => `
          <tr>
            <td>${month}</td>
            <td class="center">Rs. ${d.income.toLocaleString()}</td>
            <td class="center">Rs. ${d.expenses.toLocaleString()}</td>
            <td class="center">Rs. ${d.salaries.toLocaleString()}</td>
            <td class="center"><strong>Rs. ${(d.income - d.expenses - d.salaries).toLocaleString()}</strong></td>
          </tr>
        `).join('');
        breakdownTable = `
          <div class="section">
            <div class="section-title">Monthly Breakdown</div>
            <table class="data-table">
              <thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Salaries</th><th>Net</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `;
      } else if (data.dailyData && data.dailyData.length > 0) {
        const rows = data.dailyData.map(d => `
          <tr>
            <td>${new Date(d.date).toLocaleDateString()}</td>
            <td class="center">Rs. ${d.income.toLocaleString()}</td>
            <td class="center">Rs. ${d.expenses.toLocaleString()}</td>
            <td class="center">Rs. ${d.salaries.toLocaleString()}</td>
            <td class="center"><strong>Rs. ${d.net.toLocaleString()}</strong></td>
          </tr>
        `).join('');
        breakdownTable = `
          <div class="section">
            <div class="section-title">Daily Breakdown</div>
            <table class="data-table">
              <thead><tr><th>Date</th><th>Income</th><th>Expenses</th><th>Salaries</th><th>Net</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `;
      }

      summarySection = `
        <div class="section">
          <div class="section-title">Financial Summary</div>
          <div class="summary-grid">
            <div class="summary-box success">
              <div class="summary-label">Total Income</div>
              <div class="summary-value">Rs. ${data.totalIncome.toLocaleString()}</div>
            </div>
            <div class="summary-box danger">
              <div class="summary-label">Total Expenses</div>
              <div class="summary-value">Rs. ${data.totalExpenses.toLocaleString()}</div>
            </div>
            <div class="summary-box warning">
              <div class="summary-label">Total Salaries</div>
              <div class="summary-value">Rs. ${data.totalSalaries.toLocaleString()}</div>
            </div>
            <div class="summary-box ${data.netProfit >= 0 ? 'success' : 'danger'}">
              <div class="summary-label">Net Profit/Loss</div>
              <div class="summary-value">Rs. ${data.netProfit.toLocaleString()}</div>
            </div>
          </div>
        </div>

        ${Object.keys(data.expenseByCategory || {}).length > 0 ? `
          <div class="section">
            <div class="section-title">Expense by Category</div>
            <table class="data-table">
              <thead><tr><th>Category</th><th>Amount</th><th>Percentage</th></tr></thead>
              <tbody>${categoryRows}</tbody>
            </table>
          </div>
        ` : ''}

        ${breakdownTable}

        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line">Prepared By (Accountant)</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Verified By</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Principal / Director</div>
          </div>
        </div>
      `;
    }

    const pageInfo = totalPages > 1 
      ? `<div class="page-info">Page ${page + 1} of ${totalPages}</div>` 
      : '';

    pagesHtml += `
      <div class="print-page ${page > 0 ? 'page-break' : ''}">
        ${page === 0 ? `
          <div class="header">
            <div class="school-name">School ERP</div>
            <div class="report-title">Financial Report</div>
            <div class="period-info">${data.period}</div>
            <div class="date-range">
              From: ${new Date(data.startDate).toLocaleDateString()} | 
              To: ${new Date(data.endDate).toLocaleDateString()} | 
              Generated: ${new Date().toLocaleString()}
            </div>
          </div>

          <div class="summary-cards">
            <div class="summary-card success">
              <div class="card-label">Total Income</div>
              <div class="card-value">Rs. ${data.totalIncome.toLocaleString()}</div>
            </div>
            <div class="summary-card danger">
              <div class="card-label">Total Expenses</div>
              <div class="card-value">Rs. ${data.totalExpenses.toLocaleString()}</div>
            </div>
            <div class="summary-card warning">
              <div class="card-label">Total Salaries</div>
              <div class="card-value">Rs. ${data.totalSalaries.toLocaleString()}</div>
            </div>
            <div class="summary-card ${data.netProfit >= 0 ? 'success' : 'danger'}">
              <div class="card-label">Net Profit/Loss</div>
              <div class="card-value">Rs. ${data.netProfit.toLocaleString()}</div>
            </div>
          </div>
        ` : `
          <div class="continued-header">
            <div class="school-name-small">School ERP - Financial Report (Continued)</div>
            <div class="period-info-small">${data.period}</div>
          </div>
        `}

        <div class="section">
          <div class="section-title">Transaction Details</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th style="width: 90px;">Date</th>
                <th style="width: 70px;">Type</th>
                <th>Description</th>
                <th style="width: 100px;">Category/Method</th>
                <th style="width: 100px;">Amount</th>
              </tr>
            </thead>
            <tbody>${transRows}</tbody>
          </table>
        </div>

        ${summarySection}
        ${pageInfo}
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Financial Report - ${data.period}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Arial', sans-serif; 
          padding: 20px; 
          color: #000;
          background: #fff;
          font-size: 12px;
        }
        
        .print-page { margin-bottom: 20px; }
        .page-break { page-break-before: always; }
        
        .header { 
          text-align: center; 
          border-bottom: 3px double #000; 
          padding-bottom: 15px; 
          margin-bottom: 20px; 
        }
        .school-name { 
          font-size: 26px; 
          font-weight: bold; 
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .school-name-small {
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 5px;
        }
        .report-title { 
          font-size: 20px; 
          font-weight: bold; 
          margin-top: 10px;
          text-decoration: underline;
          text-transform: uppercase;
        }
        .period-info {
          font-size: 14px;
          margin-top: 5px;
          font-weight: bold;
          color: #2c3e50;
        }
        .period-info-small {
          text-align: center;
          font-size: 12px;
          margin-bottom: 10px;
          padding: 5px;
          background: #f5f5f5;
          border: 1px solid #000;
        }
        .date-range {
          font-size: 11px;
          color: #666;
          margin-top: 5px;
        }
        
        /* Summary Cards */
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin: 20px 0;
        }
        .summary-card {
          padding: 15px;
          border: 2px solid;
          text-align: center;
          border-radius: 5px;
        }
        .summary-card.success { border-color: #28a745; background: #f0fff4; }
        .summary-card.danger { border-color: #dc3545; background: #fff5f5; }
        .summary-card.warning { border-color: #ffc107; background: #fffbf0; }
        .card-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
        .card-value { font-size: 16px; font-weight: bold; }
        .summary-card.success .card-value { color: #28a745; }
        .summary-card.danger .card-value { color: #dc3545; }
        .summary-card.warning .card-value { color: #b8860b; }
        
        /* Sections */
        .section {
          margin: 20px 0;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
          margin-bottom: 10px;
          background: #f5f5f5;
          padding: 5px 10px;
        }
        
        /* Data Tables */
        .data-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 10px 0;
          font-size: 11px;
        }
        .data-table th, 
        .data-table td { 
          border: 1px solid #000; 
          padding: 5px; 
          text-align: left;
        }
        .data-table th { 
          background: #2c3e50; 
          color: #fff; 
          text-align: center; 
          font-weight: bold;
          text-transform: uppercase;
          font-size: 10px;
        }
        .center { text-align: center; }
        .data-table tbody tr:nth-child(even) { background: #f9f9f9; }
        
        /* Type badges */
        .type-badge {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .type-success { background: #d4edda; color: #155724; }
        .type-danger { background: #f8d7da; color: #721c24; }
        .type-warning { background: #fff3cd; color: #856404; }
        
        /* Amount colors */
        .amount-success { color: #28a745; }
        .amount-danger { color: #dc3545; }
        .amount-warning { color: #b8860b; }
        
        /* Summary Grid */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin: 10px 0;
        }
        .summary-box {
          padding: 15px;
          border: 2px solid;
          text-align: center;
          border-radius: 5px;
        }
        .summary-box.success { border-color: #28a745; background: #f0fff4; }
        .summary-box.danger { border-color: #dc3545; background: #fff5f5; }
        .summary-box.warning { border-color: #ffc107; background: #fffbf0; }
        .summary-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
        .summary-value { font-size: 16px; font-weight: bold; }
        .summary-box.success .summary-value { color: #28a745; }
        .summary-box.danger .summary-value { color: #dc3545; }
        .summary-box.warning .summary-value { color: #b8860b; }
        
        .signatures {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .signature-box {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 40px;
          padding-top: 5px;
          font-size: 11px;
        }
        
        .page-info {
          text-align: center;
          font-size: 10px;
          margin-top: 15px;
          color: #666;
          font-style: italic;
        }
        
        .no-print { 
          text-align: center; 
          margin: 20px 0;
        }
        .no-print button {
          padding: 10px 25px;
          margin: 0 5px;
          font-size: 14px;
          cursor: pointer;
          border: 1px solid #000;
          background: #fff;
        }
        .no-print button:hover { background: #f0f0f0; }
        
        @media print {
          body { padding: 10px; }
          .no-print { display: none !important; }
          .data-table { page-break-inside: auto; }
          .data-table tr { page-break-inside: avoid; page-break-after: auto; }
          .data-table thead { display: table-header-group; }
          .section { page-break-inside: avoid; }
          .summary-cards { page-break-inside: avoid; }
          .signatures { page-break-inside: avoid; }
        }
        
        @page {
          size: A4 portrait;
          margin: 1.5cm;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
      
      <div class="no-print">
        <button onclick="window.print()">🖨️ Print Report</button>
        <button onclick="window.close()">✖ Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  showToast('Full report ready for printing!', 'success');
}

// ==========================================
// ✅ PRINT SUMMARY ONLY (Single Page)
// ==========================================
function printFinancialSummary() {
  const data = window.currentFinancialReport;
  if (!data) return showToast('Generate report first', 'warning');

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) return showToast('Popup blocked!', 'warning');

  // Category breakdown
  const categoryRows = Object.entries(data.expenseByCategory || {}).map(([cat, amt]) => `
    <tr>
      <td>${cat}</td>
      <td class="center">Rs. ${amt.toLocaleString()}</td>
      <td class="center">${data.totalExpenses > 0 ? ((amt / data.totalExpenses) * 100).toFixed(1) : 0}%</td>
    </tr>
  `).join('');

  // Monthly/Daily breakdown
  let breakdownTable = '';
  if (data.monthlyData && Object.keys(data.monthlyData).length > 0) {
    const rows = Object.entries(data.monthlyData).map(([month, d]) => `
      <tr>
        <td>${month}</td>
        <td class="center">Rs. ${d.income.toLocaleString()}</td>
        <td class="center">Rs. ${d.expenses.toLocaleString()}</td>
        <td class="center">Rs. ${d.salaries.toLocaleString()}</td>
        <td class="center"><strong>Rs. ${(d.income - d.expenses - d.salaries).toLocaleString()}</strong></td>
      </tr>
    `).join('');
    breakdownTable = `
      <div class="section">
        <div class="section-title">Monthly Breakdown</div>
        <table class="data-table">
          <thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Salaries</th><th>Net</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  } else if (data.dailyData && data.dailyData.length > 0) {
    const rows = data.dailyData.map(d => `
      <tr>
        <td>${new Date(d.date).toLocaleDateString()}</td>
        <td class="center">Rs. ${d.income.toLocaleString()}</td>
        <td class="center">Rs. ${d.expenses.toLocaleString()}</td>
        <td class="center">Rs. ${d.salaries.toLocaleString()}</td>
        <td class="center"><strong>Rs. ${d.net.toLocaleString()}</strong></td>
      </tr>
    `).join('');
    breakdownTable = `
      <div class="section">
        <div class="section-title">Daily Breakdown</div>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Income</th><th>Expenses</th><th>Salaries</th><th>Net</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Financial Summary - ${data.period}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Arial', sans-serif; padding: 30px; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 15px; margin-bottom: 25px; }
        .school-name { font-size: 26px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
        .report-title { font-size: 20px; font-weight: bold; margin-top: 10px; text-decoration: underline; }
        .period-info { font-size: 14px; margin-top: 5px; color: #2c3e50; font-weight: bold; }
        .date-range { font-size: 11px; color: #666; margin-top: 5px; }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 25px 0;
        }
        .summary-card {
          padding: 20px;
          border: 2px solid;
          text-align: center;
          border-radius: 8px;
        }
        .summary-card.success { border-color: #28a745; background: #f0fff4; }
        .summary-card.danger { border-color: #dc3545; background: #fff5f5; }
        .summary-card.warning { border-color: #ffc107; background: #fffbf0; }
        .card-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
        .card-value { font-size: 22px; font-weight: bold; }
        .summary-card.success .card-value { color: #28a745; }
        .summary-card.danger .card-value { color: #dc3545; }
        .summary-card.warning .card-value { color: #b8860b; }
        
        .section { margin: 20px 0; }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
          margin-bottom: 10px;
          background: #f5f5f5;
          padding: 5px 10px;
        }
        
        .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .data-table th, .data-table td { border: 1px solid #000; padding: 8px; text-align: left; }
        .data-table th { background: #2c3e50; color: #fff; text-align: center; text-transform: uppercase; font-size: 11px; }
        .center { text-align: center; }
        .data-table tbody tr:nth-child(even) { background: #f9f9f9; }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 15px 0;
        }
        .stat-box {
          padding: 12px;
          border: 1px solid #ccc;
          background: #fafafa;
          text-align: center;
        }
        .stat-label { font-size: 11px; color: #666; text-transform: uppercase; }
        .stat-value { font-size: 16px; font-weight: bold; color: #2c3e50; margin-top: 5px; }
        
        .signatures { margin-top: 60px; display: flex; justify-content: space-around; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; font-size: 11px; }
        
        .no-print { text-align: center; margin: 20px 0; }
        .no-print button { padding: 10px 25px; margin: 0 5px; cursor: pointer; border: 1px solid #000; background: #fff; }
        
        @media print {
          .no-print { display: none !important; }
          body { padding: 15px; }
        }
        @page { size: A4 portrait; margin: 1.5cm; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">School ERP</div>
        <div class="report-title">Financial Summary Report</div>
        <div class="period-info">${data.period}</div>
        <div class="date-range">
          From: ${new Date(data.startDate).toLocaleDateString()} | 
          To: ${new Date(data.endDate).toLocaleDateString()} | 
          Generated: ${new Date().toLocaleString()}
        </div>
      </div>

      <div class="summary-cards">
        <div class="summary-card success">
          <div class="card-label">Total Income</div>
          <div class="card-value">Rs. ${data.totalIncome.toLocaleString()}</div>
        </div>
        <div class="summary-card danger">
          <div class="card-label">Total Expenses</div>
          <div class="card-value">Rs. ${data.totalExpenses.toLocaleString()}</div>
        </div>
        <div class="summary-card warning">
          <div class="card-label">Total Salaries</div>
          <div class="card-value">Rs. ${data.totalSalaries.toLocaleString()}</div>
        </div>
        <div class="summary-card ${data.netProfit >= 0 ? 'success' : 'danger'}">
          <div class="card-label">Net Profit/Loss</div>
          <div class="card-value">Rs. ${data.netProfit.toLocaleString()}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">Total Transactions</div>
          <div class="stat-value">${data.summary.totalTransactions}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Avg Daily Income</div>
          <div class="stat-value">Rs. ${Math.round(data.summary.averageDailyIncome).toLocaleString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Avg Daily Expense</div>
          <div class="stat-value">Rs. ${Math.round(data.summary.averageDailyExpense).toLocaleString()}</div>
        </div>
      </div>

      ${Object.keys(data.expenseByCategory || {}).length > 0 ? `
        <div class="section">
          <div class="section-title">Expense by Category</div>
          <table class="data-table">
            <thead><tr><th>Category</th><th>Amount</th><th>Percentage</th></tr></thead>
            <tbody>${categoryRows}</tbody>
          </table>
        </div>
      ` : ''}

      ${breakdownTable}

      <div class="signatures">
        <div class="signature-box"><div class="signature-line">Prepared By (Accountant)</div></div>
        <div class="signature-box"><div class="signature-line">Verified By</div></div>
        <div class="signature-box"><div class="signature-line">Principal / Director</div></div>
      </div>

      <div class="no-print">
        <button onclick="window.print()">🖨️ Print Summary</button>
        <button onclick="window.close()">✖ Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  showToast('Summary report ready!', 'success');
}

// Global Exports
window.loadFinancialReports = loadFinancialReports;
window.setFinancialPeriod = setFinancialPeriod;
window.resetFinancialFilters = resetFinancialFilters;
window.generateFinancialReport = generateFinancialReport;
window.printFinancialReport = printFinancialReport;
window.printFinancialSummary = printFinancialSummary;