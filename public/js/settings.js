async function loadSettings() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Settings';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/settings');
    const s = res.data;

    main.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-header bg-white"><h5 class="mb-0">School Information</h5></div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6"><label class="form-label">School Name *</label><input type="text" id="setName" class="form-control" value="${s.schoolName || ''}"></div>
            <div class="col-md-6"><label class="form-label">Academic Year</label><input type="text" id="setYear" class="form-control" value="${s.academicYear || ''}"></div>
            <div class="col-md-6"><label class="form-label">Phone</label><input type="text" id="setPhone" class="form-control" value="${s.schoolPhone || ''}"></div>
            <div class="col-md-6"><label class="form-label">Email</label><input type="email" id="setEmail" class="form-control" value="${s.schoolEmail || ''}"></div>
            <div class="col-md-12"><label class="form-label">Address</label><textarea id="setAddress" class="form-control" rows="2">${s.schoolAddress || ''}</textarea></div>
            <div class="col-md-6"><label class="form-label">Currency</label><input type="text" id="setCurrency" class="form-control" value="${s.currency || 'Rs.'}"></div>
          </div>
          <button class="btn btn-primary mt-4" onclick="saveSettings()"><i class="bi bi-save"></i> Save Settings</button>
        </div>
      </div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

async function saveSettings() {
  const data = {
    schoolName: document.getElementById('setName').value,
    academicYear: document.getElementById('setYear').value,
    schoolPhone: document.getElementById('setPhone').value,
    schoolEmail: document.getElementById('setEmail').value,
    schoolAddress: document.getElementById('setAddress').value,
    currency: document.getElementById('setCurrency').value
  };

  try {
    await api.put('/settings', data);
    showToast('Settings saved!', 'success');
  } catch (err) { showToast(err.message, 'danger'); }
}

window.loadSettings = loadSettings;
window.saveSettings = saveSettings;