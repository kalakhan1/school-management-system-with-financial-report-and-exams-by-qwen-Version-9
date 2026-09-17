async function loadDashboard() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Dashboard';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/dashboard/stats');
    const d = res.data;

    // Stat Cards
    const statCards = `
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card shadow-sm border-primary h-100">
            <div class="card-body text-center">
              <i class="bi bi-mortarboard text-primary" style="font-size: 2.5rem;"></i>
              <h6 class="text-muted mt-2">Total Students</h6>
              <h2 class="text-primary mb-0">${d.students.total}</h2>
              <small class="text-success">${d.students.active} Active</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card shadow-sm border-success h-100">
            <div class="card-body text-center">
              <i class="bi bi-person-video2 text-success" style="font-size: 2.5rem;"></i>
              <h6 class="text-muted mt-2">Total Teachers</h6>
              <h2 class="text-success mb-0">${d.teachers.total}</h2>
              <small class="text-success">${d.teachers.active} Active</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card shadow-sm border-info h-100">
            <div class="card-body text-center">
              <i class="bi bi-building text-info" style="font-size: 2.5rem;"></i>
              <h6 class="text-muted mt-2">Total Classes</h6>
              <h2 class="text-info mb-0">${d.classes}</h2>
              <small class="text-muted">All Sections</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card shadow-sm border-warning h-100">
            <div class="card-body text-center">
              <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2.5rem;"></i>
              <h6 class="text-muted mt-2">Outstanding Fees</h6>
              <h2 class="text-warning mb-0">Rs. ${d.finance.totalOutstanding.toLocaleString()}</h2>
              <small class="text-muted">Pending Collection</small>
            </div>
          </div>
        </div>
      </div>
    `;

    // Finance Summary
    const financeCards = `
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-muted mb-1">Fees Collected (This Month)</h6>
                  <h3 class="text-success mb-0">Rs. ${d.finance.feesCollectedThisMonth.toLocaleString()}</h3>
                </div>
                <i class="bi bi-cash-stack text-success" style="font-size: 2.5rem;"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-muted mb-1">Expenses (This Month)</h6>
                  <h3 class="text-danger mb-0">Rs. ${d.finance.expensesThisMonth.toLocaleString()}</h3>
                </div>
                <i class="bi bi-receipt text-danger" style="font-size: 2.5rem;"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-muted mb-1">Net Profit/Loss (This Month)</h6>
                  <h3 class="${d.finance.netThisMonth >= 0 ? 'text-success' : 'text-danger'} mb-0">Rs. ${d.finance.netThisMonth.toLocaleString()}</h3>
                </div>
                <i class="bi bi-graph-up ${d.finance.netThisMonth >= 0 ? 'text-success' : 'text-danger'}" style="font-size: 2.5rem;"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Quick Actions
    const quickActions = `
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-white"><h5 class="mb-0"><i class="bi bi-lightning-charge"></i> Quick Actions</h5></div>
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-3"><button class="btn btn-outline-primary w-100" onclick="loadStudents(); showStudentModal()"><i class="bi bi-person-plus"></i> Add Student</button></div>
            <div class="col-md-3"><button class="btn btn-outline-success w-100" onclick="loadFees()"><i class="bi bi-cash-coin"></i> Collect Fee</button></div>
            <div class="col-md-3"><button class="btn btn-outline-info w-100" onclick="loadExams()"><i class="bi bi-journal-plus"></i> Create Exam</button></div>
            <div class="col-md-3"><button class="btn btn-outline-warning w-100" onclick="loadFeeReminders()"><i class="bi bi-bell"></i> Fee Reminders</button></div>
          </div>
        </div>
      </div>
    `;

    // Monthly Chart (CSS-based bar chart)
    const maxAmount = Math.max(...d.monthlyChartData.map(m => m.amount), 1);
    const chartBars = d.monthlyChartData.map(m => {
      const height = (m.amount / maxAmount) * 150;
      return `
        <div class="text-center" style="flex: 1;">
          <div style="height: 150px; display: flex; align-items: flex-end; justify-content: center;">
            <div style="width: 40px; height: ${height}px; background: linear-gradient(to top, #0d6efd, #6ea8fe); border-radius: 4px 4px 0 0;" title="Rs. ${m.amount.toLocaleString()}"></div>
          </div>
          <small class="d-block mt-1 fw-bold">${m.month}</small>
          <small class="text-muted">Rs. ${(m.amount / 1000).toFixed(1)}k</small>
        </div>
      `;
    }).join('');

    const chartSection = `
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-white"><h5 class="mb-0"><i class="bi bi-bar-chart"></i> Fee Collection (Last 6 Months)</h5></div>
        <div class="card-body">
          <div style="display: flex; gap: 10px; align-items: flex-end;">
            ${chartBars}
          </div>
        </div>
      </div>
    `;

    // Recent Activities
    const activityRows = d.recentActivities.map(a => `
      <tr>
        <td><small>${new Date(a.createdAt).toLocaleString()}</small></td>
        <td><span class="badge bg-info">${a.action}</span></td>
        <td>${a.userId?.fullName || 'System'}</td>
      </tr>
    `).join('');

    const activitiesSection = `
      <div class="row g-3">
        <div class="col-md-8">
          <div class="card shadow-sm">
            <div class="card-header bg-white"><h5 class="mb-0"><i class="bi bi-clock-history"></i> Recent Activities</h5></div>
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light"><tr><th>Date</th><th>Action</th><th>User</th></tr></thead>
                <tbody>${activityRows || '<tr><td colspan="3" class="text-center text-muted">No recent activities</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card shadow-sm border-danger">
            <div class="card-body text-center">
              <i class="bi bi-trash text-danger" style="font-size: 2.5rem;"></i>
              <h6 class="text-muted mt-2">Items in Trash</h6>
              <h2 class="text-danger mb-0">${d.trashCount}</h2>
              <button class="btn btn-outline-danger btn-sm mt-2" onclick="loadArchive()">View Trash</button>
            </div>
          </div>
        </div>
      </div>
    `;

    main.innerHTML = statCards + financeCards + quickActions + chartSection + activitiesSection;
  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger">Failed to load dashboard: ${err.message}</div>`;
  }
}

window.loadDashboard = loadDashboard;