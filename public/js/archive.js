let currentArchivePage = 1;

async function loadArchive(page = 1) {
  currentArchivePage = page;
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Trash / Archive';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get(`/archive?limit=50&page=${page}`);
    const archive = res.data || [];
    const pagination = res.pagination || { page: 1, totalPages: 1, total: 0 };

    let rows = archive.map(a => `
      <tr>
        <td><small>${new Date(a.createdAt).toLocaleString()}</small></td>
        <td><span class="badge bg-secondary">${a.sourceModel}</span></td>
        <td><strong>${a.summary || 'Unknown'}</strong></td>
        <td><small>${a.reason || 'N/A'}</small></td>
        <td>
          <button class="btn btn-sm btn-outline-success me-1" onclick="restoreFromArchive('${a._id}')" title="Restore"><i class="bi bi-arrow-counterclockwise"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deletePermanently('${a._id}')" title="Delete Forever"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');

    let paginationHtml = '';
    if (pagination.totalPages > 1) {
      paginationHtml = `
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="text-muted">Page ${pagination.page} of ${pagination.totalPages}</div>
          <nav>
            <ul class="pagination mb-0">
              <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="loadArchive(${pagination.page - 1}); return false;">Previous</a></li>
              <li class="page-item active"><span class="page-link">${pagination.page}</span></li>
              <li class="page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="loadArchive(${pagination.page + 1}); return false;">Next</a></li>
            </ul>
          </nav>
        </div>
      `;
    }

    main.innerHTML = `
      <div class="alert alert-info"><i class="bi bi-info-circle"></i> Items in trash can be restored or permanently deleted.</div>
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Date</th><th>Type</th><th>Summary</th><th>Reason</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">Trash is empty</td></tr>'}</tbody>
        </table>
      </div></div>
      ${paginationHtml}
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

async function restoreFromArchive(id) {
  if (!confirm('Restore this record?')) return;
  try {
    const res = await api.post(`/archive/restore/${id}`);
    if (res.success) { showToast('Record restored!', 'success'); loadArchive(currentArchivePage); }
    else showToast(res.error || 'Failed to restore', 'warning');
  } catch (err) { showToast(err.message, 'danger'); }
}

async function deletePermanently(id) {
  if (!confirm('⚠️ Delete this record permanently?')) return;
  try {
    await api.delete(`/archive/${id}`);
    showToast('Permanently deleted', 'success');
    loadArchive(currentArchivePage);
  } catch (err) { showToast(err.message, 'danger'); }
}

window.loadArchive = loadArchive;
window.restoreFromArchive = restoreFromArchive;
window.deletePermanently = deletePermanently;