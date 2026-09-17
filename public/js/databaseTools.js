async function loadDatabaseTools() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Database Tools';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/database-tools/stats');
    const stats = res.data;

    const collectionRows = stats.collections.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td><span class="badge bg-primary">${c.count}</span></td>
      </tr>
    `).join('');

    main.innerHTML = `
      <div class="row g-3 mb-4">
        <div class="col-md-6"><div class="card shadow-sm p-3 text-center border-info"><h6 class="text-muted">Database Size</h6><h3 class="text-info">${(stats.dataSize / 1024 / 1024).toFixed(2)} MB</h3></div></div>
        <div class="col-md-6"><div class="card shadow-sm p-3 text-center border-secondary"><h6 class="text-muted">Storage Size</h6><h3 class="text-secondary">${(stats.storageSize / 1024 / 1024).toFixed(2)} MB</h3></div></div>
      </div>
      <div class="card shadow-sm">
        <div class="card-header bg-white"><h5 class="mb-0">Collections Overview</h5></div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light"><tr><th>Collection Name</th><th>Document Count</th></tr></thead>
            <tbody>${collectionRows}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

window.loadDatabaseTools = loadDatabaseTools;