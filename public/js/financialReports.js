async function loadFinancialReports() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Financial Reports';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const year = new Date().getFullYear();
    const res = await api.get(`/financial-reports/summary?year=${year}`);
    const data = res.data;

    const monthlyRows = Object.entries(data.monthlyData).map(([month, d]) => `
      <tr>
        <td><strong>${month}</strong></td>
        <td class="text-success">Rs. ${d.income.toLocaleString()}</td>
        <td class="text-danger">Rs. ${d.expenses.toLocaleString()}</td>
        <td class="text-warning">Rs. ${d.salaries.toLocaleString()}</td>
        <td class="${d.income - d.expenses - d.salaries >= 0 ? 'text-success' : 'text-danger'} fw-bold">Rs. ${(d.income - d.expenses - d.salaries).toLocaleString()}</td>
      </tr>
    `).join('');

    main.innerHTML = `
      <div class="row g-3 mb-4">
        <div class="col-md-3"><div class="card shadow-sm p-3 text-center border-success"><h6 class="text-muted">Total Income</h6><h3 class="text-success">Rs. ${data.totalIncome.toLocaleString()}</h3></div></div>
        <div class="col-md-3"><div class="card shadow-sm p-3 text-center border-danger"><h6 class="text-muted">Total Expenses</h6><h3 class="text-danger">Rs. ${data.totalExpenses.toLocaleString()}</h3></div></div>
        <div class="col-md-3"><div class="card shadow-sm p-3 text-center border-warning"><h6 class="text-muted">Total Salaries</h6><h3 class="text-warning">Rs. ${data.totalSalaries.toLocaleString()}</h3></div></div>
        <div class="col-md-3"><div class="card shadow-sm p-3 text-center ${data.netProfit >= 0 ? 'border-success' : 'border-danger'}"><h6 class="text-muted">Net Profit/Loss</h6><h3 class="${data.netProfit >= 0 ? 'text-success' : 'text-danger'}">Rs. ${data.netProfit.toLocaleString()}</h3></div></div>
      </div>
      <div class="card shadow-sm">
        <div class="card-header bg-white"><h5 class="mb-0">Monthly Breakdown - ${data.year}</h5></div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light"><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Salaries</th><th>Net</th></tr></thead>
            <tbody>${monthlyRows}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

window.loadFinancialReports = loadFinancialReports;