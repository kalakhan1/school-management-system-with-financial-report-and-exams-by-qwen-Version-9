let currentDataManagerModel = 'students';
let currentDataManagerSearch = '';
let currentDataManagerPage = 1;
let currentDataManagerData = []; // Store current data for editing

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

    // ✅ Store data for editing
    currentDataManagerData = data || [];

    if (!data || data.length === 0) { content.innerHTML = '<div class="alert alert-info">No records found</div>'; return; }

    const headers = Object.keys(data[0]).filter(h => !['_id', '__v', 'passwordHash'].includes(h));
    let headerRow = headers.map(h => `<th>${h}</th>`).join('') + '<th>Actions</th>';

    let rows = data.map(item => {
      let cells = headers.map(h => {
        let val = item[h];
        if (val && typeof val === 'object') {
          // Handle nested objects (references)
          if (val.fullName) val = val.fullName;
          else if (val.username) val = val.username;
          else if (val.className) val = val.className;
          else if (Array.isArray(val)) val = val.join(', ');
          else val = JSON.stringify(val);
        }
        if (val === null || val === undefined) val = '-';
        return `<td>${String(val).substring(0, 30)}</td>`;
      }).join('');
      cells += `<td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editDataManagerRow('${model}', '${item._id}')" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteDataManagerRow('${model}', '${item._id}')" title="Delete"><i class="bi bi-trash"></i></button>
      </td>`;
      return `<tr>${cells}</tr>`;
    }).join('');

    // Pagination
    let paginationHtml = '';
    if (pagination.totalPages > 1) {
      paginationHtml = `
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="text-muted">Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total)</div>
          <nav>
            <ul class="pagination mb-0">
              <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="loadDataManagerSheet('${model}', '${search}', ${pagination.page - 1}); return false;">Previous</a>
              </li>
              <li class="page-item active"><span class="page-link">${pagination.page}</span></li>
              <li class="page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="loadDataManagerSheet('${model}', '${search}', ${pagination.page + 1}); return false;">Next</a>
              </li>
            </ul>
          </nav>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0">${res.modelName || model} (${pagination.total} records)</h5>
        </div>
        <div class="table-responsive">
          <table class="table table-hover table-sm mb-0">
            <thead class="table-light"><tr>${headerRow}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      ${paginationHtml}
    `;
  } catch (err) { content.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

// ==========================================
// ✅ EDIT DATA ROW - Dynamic Form Generation
// ==========================================

async function editDataManagerRow(model, id) {
  try {
    // Find the item in current data
    const item = currentDataManagerData.find(d => d._id === id);
    if (!item) {
      showToast('Record not found', 'danger');
      return;
    }

    // Generate dynamic form
    const formHtml = generateEditForm(item, model);

    const modalHtml = `
      <div class="modal fade show" id="editDataModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-pencil-square"></i> Edit Record</h5>
              <button type="button" class="btn-close" onclick="closeDataManagerModal('editDataModal')"></button>
            </div>
            <div class="modal-body">
              <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> 
                <strong>Note:</strong> Reference fields (marked with 🔒) are read-only. Only editable fields can be modified.
              </div>
              <form id="editDataForm">
                ${formHtml}
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="closeDataManagerModal('editDataModal')">Cancel</button>
              <button class="btn btn-primary" onclick="saveDataManagerRow('${model}', '${id}')">
                <i class="bi bi-save"></i> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modalContainer').innerHTML = modalHtml;
  } catch (err) {
    showToast('Failed to load record: ' + err.message, 'danger');
  }
}

// ✅ Generate dynamic form based on data structure
function generateEditForm(data, model) {
  // Fields that should be read-only (references, system fields)
  const readOnlyFields = [
    '_id', '__v', 'createdAt', 'updatedAt', 'passwordHash',
    'student', 'teacher', 'collectedBy', 'paidBy', 'addedBy', 
    'registeredBy', 'createdBy', 'markedBy', 'deletedBy', 'userId',
    'registration', 'exam'
  ];

  // Fields that should be completely hidden
  const hiddenFields = ['__v', 'passwordHash'];

  let formHtml = '<div class="row g-3">';

  Object.keys(data).forEach(key => {
    if (hiddenFields.includes(key)) return;

    const value = data[key];
    const isReadOnly = readOnlyFields.includes(key);
    const colClass = 'col-md-6';

    let inputHtml = '';
    let label = formatFieldName(key);

    // Detect field type and generate appropriate input
    if (isReadOnly) {
      // Read-only field
      let displayValue = value;
      if (value && typeof value === 'object') {
        if (value.fullName) displayValue = value.fullName;
        else if (value.username) displayValue = value.username;
        else if (Array.isArray(value)) displayValue = value.join(', ');
        else displayValue = JSON.stringify(value);
      }
      if (displayValue === null || displayValue === undefined) displayValue = '-';

      inputHtml = `
        <input type="text" class="form-control" value="${String(displayValue).substring(0, 100)}" readonly 
               style="background-color: #e9ecef; cursor: not-allowed;">
        <small class="text-muted">🔒 Read-only (reference field)</small>
      `;
    } else if (typeof value === 'boolean') {
      // Boolean field
      inputHtml = `
        <select class="form-select edit-field" data-key="${key}" data-type="boolean">
          <option value="true" ${value === true ? 'selected' : ''}>Yes</option>
          <option value="false" ${value === false ? 'selected' : ''}>No</option>
        </select>
      `;
    } else if (typeof value === 'number') {
      // Number field
      inputHtml = `
        <input type="number" class="form-control edit-field" data-key="${key}" data-type="number" 
               value="${value}" step="any">
      `;
    } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
      // Date field
      const dateValue = value instanceof Date ? value.toISOString().split('T')[0] : value.split('T')[0];
      inputHtml = `
        <input type="date" class="form-control edit-field" data-key="${key}" data-type="date" 
               value="${dateValue}">
      `;
    } else if (Array.isArray(value)) {
      // Array field (comma-separated)
      inputHtml = `
        <input type="text" class="form-control edit-field" data-key="${key}" data-type="array" 
               value="${value.join(', ')}" placeholder="Comma-separated values">
        <small class="text-muted">Separate multiple values with commas</small>
      `;
    } else if (typeof value === 'object' && value !== null) {
      // Object field (read-only, show as JSON)
      inputHtml = `
        <textarea class="form-control" rows="3" readonly style="background-color: #e9ecef; font-family: monospace; font-size: 12px;">${JSON.stringify(value, null, 2)}</textarea>
        <small class="text-muted">🔒 Complex object (read-only)</small>
      `;
    } else if (key === 'description' || key === 'remarks' || key === 'address' || key === 'qualification') {
      // Long text field
      inputHtml = `
        <textarea class="form-control edit-field" data-key="${key}" data-type="string" rows="3">${value || ''}</textarea>
      `;
    } else if (key === 'email') {
      // Email field
      inputHtml = `
        <input type="email" class="form-control edit-field" data-key="${key}" data-type="string" 
               value="${value || ''}" placeholder="email@example.com">
      `;
    } else if (key === 'phone' || key === 'cnic' || key === 'grNo' || key === 'empCode' || key === 'rollNo') {
      // Code/ID field
      inputHtml = `
        <input type="text" class="form-control edit-field" data-key="${key}" data-type="string" 
               value="${value || ''}">
      `;
    } else if (key === 'status') {
      // Status dropdown
      const statusOptions = ['Active', 'Inactive', 'Left', 'Resigned', 'Cleared', 'Pending', 'Special Permission'];
      const options = statusOptions.map(s => `<option value="${s}" ${value === s ? 'selected' : ''}>${s}</option>`).join('');
      inputHtml = `
        <select class="form-select edit-field" data-key="${key}" data-type="string">
          ${options}
        </select>
      `;
    } else if (key === 'role') {
      // Role dropdown
      const roleOptions = ['Admin', 'Accountant', 'Clerk'];
      const options = roleOptions.map(r => `<option value="${r}" ${value === r ? 'selected' : ''}>${r}</option>`).join('');
      inputHtml = `
        <select class="form-select edit-field" data-key="${key}" data-type="string">
          ${options}
        </select>
      `;
    } else if (key === 'paymentMethod') {
      // Payment method dropdown
      const methodOptions = ['Cash', 'Bank Transfer', 'Cheque', 'Online'];
      const options = methodOptions.map(m => `<option value="${m}" ${value === m ? 'selected' : ''}>${m}</option>`).join('');
      inputHtml = `
        <select class="form-select edit-field" data-key="${key}" data-type="string">
          ${options}
        </select>
      `;
    } else if (key === 'category') {
      // Category dropdown
      const categoryOptions = ['Utilities', 'Maintenance', 'Supplies', 'Transport', 'Miscellaneous'];
      const options = categoryOptions.map(c => `<option value="${c}" ${value === c ? 'selected' : ''}>${c}</option>`).join('');
      inputHtml = `
        <select class="form-select edit-field" data-key="${key}" data-type="string">
          ${options}
        </select>
      `;
    } else if (key === 'feeStatus' || key === 'status') {
      // Generic status
      inputHtml = `
        <input type="text" class="form-control edit-field" data-key="${key}" data-type="string" 
               value="${value || ''}">
      `;
    } else {
      // Default: text input
      inputHtml = `
        <input type="text" class="form-control edit-field" data-key="${key}" data-type="string" 
               value="${value || ''}">
      `;
    }

    formHtml += `
      <div class="${colClass}">
        <label class="form-label fw-bold">${label}</label>
        ${inputHtml}
      </div>
    `;
  });

  formHtml += '</div>';
  return formHtml;
}

// ✅ Format field name for display
function formatFieldName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// ✅ Save edited data
async function saveDataManagerRow(model, id) {
  try {
    const form = document.getElementById('editDataForm');
    const fields = form.querySelectorAll('.edit-field');
    
    const updateData = {};
    
    fields.forEach(field => {
      const key = field.dataset.key;
      const type = field.dataset.type;
      let value = field.value;

      // Type conversion
      if (type === 'number') {
        value = value === '' ? null : parseFloat(value);
      } else if (type === 'boolean') {
        value = value === 'true';
      } else if (type === 'date') {
        value = value ? new Date(value) : null;
      } else if (type === 'array') {
        value = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
      }

      updateData[key] = value;
    });

    if (Object.keys(updateData).length === 0) {
      showToast('No changes to save', 'warning');
      return;
    }

    // API call
    await api.put(`/data-manager/${model}/${id}`, updateData);
    showToast('Record updated successfully!', 'success');
    closeDataManagerModal('editDataModal');
    
    // Refresh data
    loadDataManagerSheet(currentDataManagerModel, currentDataManagerSearch, currentDataManagerPage);
  } catch (err) {
    showToast('Failed to update: ' + err.message, 'danger');
  }
}

// ✅ Delete data row
async function deleteDataManagerRow(model, id) {
  if (!confirm('Are you sure you want to delete this record? It will be moved to trash.')) return;
  
  try {
    await api.delete(`/data-manager/${model}/${id}`);
    showToast('Record moved to trash', 'success');
    loadDataManagerSheet(currentDataManagerModel, currentDataManagerSearch, currentDataManagerPage);
  } catch (err) {
    showToast('Failed to delete: ' + err.message, 'danger');
  }
}

// ✅ Close modal
function closeDataManagerModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Global Exports
window.loadDataManager = loadDataManager;
window.changeDataManagerModel = changeDataManagerModel;
window.debounceDataManagerSearch = debounceDataManagerSearch;
window.clearDataManagerSearch = clearDataManagerSearch;
window.loadDataManagerSheet = loadDataManagerSheet;
window.editDataManagerRow = editDataManagerRow;
window.saveDataManagerRow = saveDataManagerRow;
window.deleteDataManagerRow = deleteDataManagerRow;
window.closeDataManagerModal = closeDataManagerModal;