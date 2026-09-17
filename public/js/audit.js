async function loadAuditLogs() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Audit Logs';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/audit?limit=100');
    const logs = res.data || [];

    let rows = logs.map(l => `
      <tr>
        <td><small>${new Date(l.createdAt).toLocaleString()}</small></td>
        <td><span class="badge bg-info">${l.action}</span></td>
        <td>${l.userId?.fullName || 'System'}</td>
        <td><small>${JSON.stringify(l.details).substring(0, 100)}...</small></td>
      </tr>
    `).join('');

    main.innerHTML = `
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Date</th><th>Action</th><th>User</th><th>Details</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4" class="text-center text-muted">No audit logs found</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

window.loadAuditLogs = loadAuditLogs;