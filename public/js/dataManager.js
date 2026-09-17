let currentDataManagerModel = 'students';
let currentDataManagerSearch = '';
let currentDataManagerPage = 1;

async function loadDataManager() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Data Manager';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const modelsRes = await api.get('/data-manager/models');
    const models = modelsRes.data;
    const modelOptions = models.map(m => `<option value="${m.key}" ${m.key === currentDataManagerModel ? 'selected' : ''}>${m.label}</option>`).join('');

    main.innerHTML = `
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4"><label class="form-label">Select Sheet</label><select id="dmSheet" class="form-select" onchange="changeDataManagerModel(this.value)">${modelOptions}</select></div>
            <div class="col-md-6"><label class="form-label">Search</label><input type="text" id="dmSearch" class="form-control" placeholder="Search..." oninput="debounceDataManagerSearch(this.value)"></div>
            <div class="col-md-2 d-flex align-items-end"><button class="btn btn-outline-danger w-100" onclick="clearDataManagerSearch()">Clear</button></div>
          </div>
        </div>
      </div>
      <div id="dmContent"></div>
    `;
    loadDataManagerSheet(currentDataManagerModel, '', 1);
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

function changeDataManagerModel(model) {
  currentDataManagerModel = model;
  currentDataManagerSearch = '';
  currentDataManagerPage = 1;
  loadDataManagerSheet(model, '', 1);
}

let dmDebounceTimer;
function debounceDataManagerSearch(value) {
  clearTimeout(dmDebounceTimer);
  dmDebounceTimer = setTimeout(() => loadDataManagerSheet(currentDataManagerModel, value, 1), 400);
}

function clearDataManagerSearch() {
  document.getElementById('dmSearch').value = '';
  loadDataManagerSheet(currentDataManagerModel, '', 1);
}

async function loadDataManagerSheet(model, search = '', page = 1) {
  const content = document.getElementById('dmContent');
  content.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get(`/data-manager/${model}?search=${encodeURIComponent(search)}&page=${page}&limit=50`);
    const data = res.data;
    const pagination = res.pagination || { page: 1, totalPages: 1, total: 0 };

    if (!data || data.length === 0) { content.innerHTML = '<div class="alert alert-info">No records found</div>'; return; }

    const headers = Object.keys(data[0]).filter(h => !['_id', '__v', 'passwordHash'].includes(h));
    let headerRow = headers.map(h => `<th>${h}</th>`).join('') + '<th>Actions</th>';

    let rows = data.map(item => {
      let cells = headers.map(h => {
        let val = item[h];
        if (val && typeof val === 'object') val = val.fullName || val.username || JSON.stringify(val);
        return `<td>${String(val || '').substring(0, 30)}</td>`;
      }).join('');
      cells += `<td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editDataManagerRow('${model}', '${item._id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteDataManagerRow('${model}', '${item._id}')"><i class="bi bi-trash"></i></button>
      </td>`;
      return `<tr>${cells}</tr>`;
    }).join('');

    content.innerHTML = `
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover table-sm mb-0">
          <thead class="table-light"><tr>${headerRow}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) { content.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

async function editDataManagerRow(model, id) {
  showToast('Edit feature coming soon. Use specific module pages for editing.', 'info');
}

async function deleteDataManagerRow(model, id) {
  if (!confirm('Move this record to Trash?')) return;
  try {
    await api.delete(`/data-manager/${model}/${id}`);
    showToast('Moved to trash', 'success');
    loadDataManagerSheet(currentDataManagerModel, currentDataManagerSearch, currentDataManagerPage);
  } catch (err) { showToast(err.message, 'danger'); }
}

window.loadDataManager = loadDataManager;
window.changeDataManagerModel = changeDataManagerModel;
window.debounceDataManagerSearch = debounceDataManagerSearch;
window.clearDataManagerSearch = clearDataManagerSearch;
window.loadDataManagerSheet = loadDataManagerSheet;
window.editDataManagerRow = editDataManagerRow;
window.deleteDataManagerRow = deleteDataManagerRow;