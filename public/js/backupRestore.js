// ==========================================
// DATA BACKUP & RESTORE SYSTEM
// ==========================================

async function loadBackupRestore() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Backup & Restore';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/backup/info');
    const info = res.data;

    const collectionCheckboxes = info.collections.map(c => `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${c.name}" id="coll_${c.name}" checked>
        <label class="form-check-label" for="coll_${c.name}">
          <strong>${c.displayName}</strong> 
          <span class="badge bg-secondary ms-1">${c.count} records</span>
        </label>
      </div>
    `).join('');

    main.innerHTML = `
      <!-- Warning Alert -->
      <div class="alert alert-danger d-flex align-items-center" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
        <div>
          <strong>Admin Only:</strong> Backup & Restore operations are critical. 
          <strong>Restore will DELETE all existing data</strong> and replace it with backup data.
        </div>
      </div>

      <!-- Database Info Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card shadow-sm border-primary h-100">
            <div class="card-body text-center">
              <i class="bi bi-database text-primary" style="font-size: 2.5rem;"></i>
              <h6 class="text-muted mt-2">Database Name</h6>
              <h5 class="text-primary mb-0">${info.databaseName}</h5>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card shadow-sm border-success h-100">
            <div class="card-body text-center">
              <i class="bi bi-hdd text-success" style="font-size: 2.5rem;"></i>
              <h6 class="text-muted mt-2">Data Size</h6>
              <h5 class="text-success mb-0">${(info.dataSize / 1024 / 1024).toFixed(2)} MB</h5>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card shadow-sm border-info h-100">
            <div class="card-body text-center">
              <i class="bi bi-collection text-info" style="font-size: 2.5rem;"></i>
              <h6 class="text-muted mt-2">Collections</h6>
              <h5 class="text-info mb-0">${info.collections.length}</h5>
            </div>
          </div>
        </div>
      </div>

      <!-- Backup Section -->
      <div class="row g-4">
        <!-- Full Backup -->
        <div class="col-md-6">
          <div class="card shadow-sm border-success h-100">
            <div class="card-header bg-success text-white">
              <h5 class="mb-0"><i class="bi bi-download"></i> Full Database Backup</h5>
            </div>
            <div class="card-body">
              <p class="text-muted">Download complete backup of all collections in JSON format. This file can be used to restore your entire database.</p>
              <div class="alert alert-info small">
                <i class="bi bi-info-circle"></i> Recommended: Take full backup before major changes.
              </div>
              <button class="btn btn-success w-100 btn-lg" onclick="createFullBackup()">
                <i class="bi bi-cloud-download"></i> Create Full Backup
              </button>
            </div>
          </div>
        </div>

        <!-- Selective Backup -->
        <div class="col-md-6">
          <div class="card shadow-sm border-primary h-100">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0"><i class="bi bi-funnel"></i> Selective Backup</h5>
            </div>
            <div class="card-body">
              <p class="text-muted">Backup specific collections only. Select the collections you want to include.</p>
              <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                ${collectionCheckboxes}
              </div>
              <div class="d-grid gap-2">
                <button class="btn btn-outline-primary btn-sm" onclick="toggleAllCollections(true)">
                  <i class="bi bi-check-all"></i> Select All
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="toggleAllCollections(false)">
                  <i class="bi bi-x-lg"></i> Deselect All
                </button>
                <button class="btn btn-primary" onclick="createSelectiveBackup()">
                  <i class="bi bi-cloud-download"></i> Create Selective Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Restore Section -->
      <div class="card shadow-sm border-danger mt-4">
        <div class="card-header bg-danger text-white">
          <h5 class="mb-0"><i class="bi bi-upload"></i> Restore Database</h5>
        </div>
        <div class="card-body">
          <div class="alert alert-danger">
            <strong>⚠️ Warning:</strong> Restoring a backup will <strong>PERMANENTLY DELETE</strong> all current data and replace it with backup data. This action cannot be undone!
          </div>
          
          <div class="mb-3">
            <label class="form-label fw-bold">Select Backup File (JSON) *</label>
            <input type="file" id="restoreFile" class="form-control" accept=".json,application/json" required>
            <small class="text-muted">Only JSON backup files created by this system are supported.</small>
          </div>

          <div id="filePreview" class="d-none mb-3">
            <div class="alert alert-secondary">
              <strong>File Info:</strong>
              <div id="fileInfo"></div>
            </div>
          </div>

          <button class="btn btn-danger btn-lg w-100" onclick="restoreDatabase()">
            <i class="bi bi-arrow-counterclockwise"></i> Restore Database
          </button>
        </div>
      </div>

      <!-- Best Practices -->
      <div class="card shadow-sm mt-4">
        <div class="card-header bg-white">
          <h5 class="mb-0"><i class="bi bi-lightbulb"></i> Best Practices</h5>
        </div>
        <div class="card-body">
          <ul class="mb-0">
            <li>Take <strong>full backup</strong> before major system changes or updates</li>
            <li>Store backup files in <strong>multiple secure locations</strong> (cloud + local)</li>
            <li>Test restore process <strong>regularly</strong> to ensure backups are valid</li>
            <li>Keep at least <strong>3 recent backups</strong> (daily, weekly, monthly)</li>
            <li>Never share backup files via <strong>unsecured channels</strong> (contains sensitive data)</li>
            <li>Before restoring, always create a <strong>fresh backup</strong> of current data</li>
          </ul>
        </div>
      </div>
    `;

    // File input listener
    document.getElementById('restoreFile').addEventListener('change', previewBackupFile);

  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger">Failed to load: ${err.message}</div>`;
  }
}

// ==========================================
// BACKUP FUNCTIONS
// ==========================================

async function createFullBackup() {
  if (!confirm('Create full database backup? The file will be downloaded automatically.')) return;

  try {
    showToast('Creating backup... This may take a moment.', 'info');
    
    const token = localStorage.getItem('token');
    const response = await fetch('/api/backup/create', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Backup failed');
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match) filename = match[1];
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    showToast('✅ Full backup downloaded successfully!', 'success');
  } catch (err) {
    showToast('Backup failed: ' + err.message, 'danger');
  }
}

async function createSelectiveBackup() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="coll_"]:checked');
  const collections = Array.from(checkboxes).map(cb => cb.value);

  if (collections.length === 0) {
    return showToast('Please select at least one collection', 'warning');
  }

  if (!confirm(`Create backup of ${collections.length} selected collection(s)?`)) return;

  try {
    showToast('Creating selective backup...', 'info');
    
    const token = localStorage.getItem('token');
    const response = await fetch('/api/backup/create-selective', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ collections })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Backup failed');
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `selective_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match) filename = match[1];
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    showToast('✅ Selective backup downloaded successfully!', 'success');
  } catch (err) {
    showToast('Backup failed: ' + err.message, 'danger');
  }
}

function toggleAllCollections(selectAll) {
  const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="coll_"]');
  checkboxes.forEach(cb => cb.checked = selectAll);
}

// ==========================================
// RESTORE FUNCTIONS
// ==========================================

let backupFileData = null;

async function previewBackupFile(event) {
  const file = event.target.files[0];
  const preview = document.getElementById('filePreview');
  const info = document.getElementById('fileInfo');

  if (!file) {
    preview.classList.add('d-none');
    backupFileData = null;
    return;
  }

  if (!file.name.endsWith('.json')) {
    showToast('Please select a JSON file', 'warning');
    event.target.value = '';
    return;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.metadata || !data.data) {
      throw new Error('Invalid backup file format');
    }

    backupFileData = data;

    const collectionsInfo = data.metadata.collections.map(c => 
      `<span class="badge bg-secondary me-1">${c.name}: ${c.count}</span>`
    ).join('');

    info.innerHTML = `
      <div class="mb-2"><strong>Filename:</strong> ${file.name}</div>
      <div class="mb-2"><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</div>
      <div class="mb-2"><strong>Backup Date:</strong> ${new Date(data.metadata.createdAt).toLocaleString()}</div>
      <div class="mb-2"><strong>Created By:</strong> ${data.metadata.createdBy || 'Unknown'}</div>
      <div class="mb-2"><strong>Collections:</strong> ${data.metadata.collections.length}</div>
      <div>${collectionsInfo}</div>
    `;

    preview.classList.remove('d-none');
    showToast('Backup file validated successfully', 'success');
  } catch (err) {
    showToast('Invalid backup file: ' + err.message, 'danger');
    event.target.value = '';
    preview.classList.add('d-none');
    backupFileData = null;
  }
}

async function restoreDatabase() {
  if (!backupFileData) {
    return showToast('Please select a valid backup file first', 'warning');
  }

  // Triple confirmation for safety
  if (!confirm('⚠️ FINAL WARNING: This will DELETE all current data and replace with backup data. Continue?')) return;
  if (!confirm('⚠️ Are you ABSOLUTELY SURE? This action CANNOT be undone!')) return;
  if (!confirm('⚠️ Last chance! Type "YES" mentally and click OK to proceed.')) return;

  try {
    showToast('Restoring database... Please wait. Do not close this window.', 'warning');
    
    const res = await api.post('/backup/restore', backupFileData);
    
    if (res.success) {
      const stats = res.data;
      showToast(`✅ Restore complete! ${stats.collections} collections, ${stats.documents} documents restored.`, 'success');
      
      if (stats.errors && stats.errors.length > 0) {
        console.warn('Restore had some errors:', stats.errors);
        showToast(`⚠️ ${stats.errors.length} collection(s) had errors. Check console.`, 'warning');
      }

      // Reload page after 2 seconds
      setTimeout(() => {
        showToast('Reloading application...', 'info');
        window.location.reload();
      }, 2000);
    } else {
      showToast('Restore failed: ' + res.error, 'danger');
    }
  } catch (err) {
    showToast('Restore failed: ' + err.message, 'danger');
  }
}

// Global Exports
window.loadBackupRestore = loadBackupRestore;
window.createFullBackup = createFullBackup;
window.createSelectiveBackup = createSelectiveBackup;
window.toggleAllCollections = toggleAllCollections;
window.restoreDatabase = restoreDatabase;