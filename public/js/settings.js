// ==========================================
// SETTINGS PAGE (WITH THEME COLOR PICKER)
// ==========================================

async function loadSettings() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Settings';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/settings');
    const s = res.data;

    // Preset colors
    const presetColors = [
      { name: 'Blue', color: '#0d6efd' },
      { name: 'Red', color: '#dc3545' },
      { name: 'Green', color: '#198754' },
      { name: 'Purple', color: '#6f42c1' },
      { name: 'Orange', color: '#fd7e14' },
      { name: 'Teal', color: '#20c997' },
      { name: 'Pink', color: '#d63384' },
      { name: 'Indigo', color: '#6610f2' },
      { name: 'Cyan', color: '#0dcaf0' },
      { name: 'Dark Blue', color: '#004080' },
      { name: 'Maroon', color: '#800000' },
      { name: 'Navy', color: '#000080' }
    ];

    const colorSwatches = presetColors.map(c => `
      <div class="color-swatch ${s.themeColor === c.color ? 'active' : ''}" 
           style="background-color: ${c.color};" 
           onclick="selectThemeColor('${c.color}')" 
           title="${c.name}">
      </div>
    `).join('');

    main.innerHTML = `
      <!-- School Information -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-white"><h5 class="mb-0"><i class="bi bi-building"></i> School Information</h5></div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6"><label class="form-label">School Name *</label><input type="text" id="setName" class="form-control" value="${s.schoolName || ''}"></div>
            <div class="col-md-6"><label class="form-label">Academic Year</label><input type="text" id="setYear" class="form-control" value="${s.academicYear || ''}"></div>
            <div class="col-md-6"><label class="form-label">Phone</label><input type="text" id="setPhone" class="form-control" value="${s.schoolPhone || ''}"></div>
            <div class="col-md-6"><label class="form-label">Email</label><input type="email" id="setEmail" class="form-control" value="${s.schoolEmail || ''}"></div>
            <div class="col-md-12"><label class="form-label">Address</label><textarea id="setAddress" class="form-control" rows="2">${s.schoolAddress || ''}</textarea></div>
            <div class="col-md-6"><label class="form-label">Currency</label><input type="text" id="setCurrency" class="form-control" value="${s.currency || 'Rs.'}"></div>
          </div>
          <button class="btn btn-primary mt-4" onclick="saveSettings()"><i class="bi bi-save"></i> Save School Info</button>
        </div>
      </div>

      <!-- Theme Color Picker -->
      <div class="card shadow-sm">
        <div class="card-header bg-white"><h5 class="mb-0"><i class="bi bi-palette"></i> Theme Color</h5></div>
        <div class="card-body">
          <div class="alert alert-info">
            <i class="bi bi-info-circle"></i> 
            <strong>Note:</strong> Theme color will be applied to sidebar, buttons, links, and ID cards across the entire application.
          </div>

          <!-- Preset Colors -->
          <label class="form-label fw-bold">Select Preset Color:</label>
          <div class="color-picker-container">
            ${colorSwatches}
          </div>

          <!-- Custom Color -->
          <div class="row g-3 mt-3">
            <div class="col-md-6">
              <label class="form-label fw-bold">Or Enter Custom Color (Hex):</label>
              <div class="input-group">
                <span class="input-group-text">#</span>
                <input type="text" id="customColorInput" class="form-control" 
                       placeholder="0d6efd" maxlength="6" 
                       value="${s.themeColor ? s.themeColor.replace('#', '') : ''}"
                       oninput="previewCustomColor(this.value)">
                <button class="btn btn-outline-primary" onclick="applyCustomColor()">
                  <i class="bi bi-check"></i> Apply
                </button>
              </div>
              <small class="text-muted">Enter 6-digit hex code (e.g., 0d6efd, dc3545, 198754)</small>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Or Use Color Picker:</label>
              <input type="color" id="colorPickerInput" class="form-control form-control-color" 
                     value="${s.themeColor || '#0d6efd'}" 
                     onchange="applyColorPicker(this.value)" 
                     style="width: 100%; height: 45px; cursor: pointer;">
            </div>
          </div>

          <!-- Live Preview -->
          <div class="theme-preview-box mt-4">
            <h6 class="mb-3"><i class="bi bi-eye"></i> Live Preview:</h6>
            <div class="theme-preview-sidebar">
              <strong>Sidebar Preview</strong>
              <div class="mt-2">
                <small>📊 Dashboard</small><br>
                <small>👥 Users</small><br>
                <small>🎓 Students</small>
              </div>
            </div>
            <div>
              <span class="theme-preview-button">Primary Button</span>
              <a href="#" style="color: var(--theme-primary);">Sample Link</a>
            </div>
          </div>

          <!-- Current Theme Display -->
          <div class="mt-3">
            <strong>Current Theme Color:</strong> 
            <span id="currentThemeDisplay" style="display: inline-block; width: 20px; height: 20px; background-color: ${s.themeColor || '#0d6efd'}; border-radius: 4px; vertical-align: middle; margin: 0 5px;"></span>
            <code id="currentThemeCode">${s.themeColor || '#0d6efd'}</code>
          </div>

          <button class="btn btn-success mt-4" onclick="saveThemeColor()"><i class="bi bi-palette"></i> Save Theme Color</button>
        </div>
      </div>
    `;

    // Store current theme color
    window.currentThemeColor = s.themeColor || '#0d6efd';
  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger">Failed to load: ${err.message}</div>`;
  }
}

// ✅ Select preset color
function selectThemeColor(color) {
  window.currentThemeColor = color;
  
  // Update UI
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Update preview
  applyThemePreview(color);
  
  // Update custom color input
  document.getElementById('customColorInput').value = color.replace('#', '');
  document.getElementById('colorPickerInput').value = color;
}

// ✅ Preview custom color
function previewCustomColor(hex) {
  if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
    const color = '#' + hex;
    applyThemePreview(color);
    window.currentThemeColor = color;
    
    // Remove active from swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.classList.remove('active');
    });
  }
}

// ✅ Apply custom color
function applyCustomColor() {
  const hex = document.getElementById('customColorInput').value;
  if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
    showToast('Invalid hex color. Use 6-digit hex code (e.g., 0d6efd)', 'danger');
    return;
  }
  
  const color = '#' + hex;
  window.currentThemeColor = color;
  applyThemePreview(color);
  showToast('Custom color applied! Click "Save Theme Color" to save.', 'info');
}

// ✅ Apply color from picker
function applyColorPicker(color) {
  window.currentThemeColor = color;
  applyThemePreview(color);
  
  // Update custom input
  document.getElementById('customColorInput').value = color.replace('#', '');
  
  // Remove active from swatches
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.classList.remove('active');
  });
}

// ✅ Apply theme preview (live update)
function applyThemePreview(color) {
  // Update CSS variables
  document.documentElement.style.setProperty('--theme-primary', color);
  document.documentElement.style.setProperty('--theme-primary-dark', adjustColor(color, -20));
  document.documentElement.style.setProperty('--theme-primary-light', adjustColor(color, 40));
  
  const rgb = hexToRgb(color);
  document.documentElement.style.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  
  // Update display
  document.getElementById('currentThemeDisplay').style.backgroundColor = color;
  document.getElementById('currentThemeCode').textContent = color;
}

// ✅ Save theme color to backend
async function saveThemeColor() {
  if (!window.currentThemeColor) {
    showToast('Please select a color first', 'warning');
    return;
  }

  try {
    await api.put('/settings/theme', { themeColor: window.currentThemeColor });
    showToast('✅ Theme color saved successfully!', 'success');
    
    // Apply to current session
    localStorage.setItem('themeColor', window.currentThemeColor);
    applyThemePreview(window.currentThemeColor);
    
    showToast('Theme applied! Refresh page to see changes everywhere.', 'info');
  } catch (err) {
    showToast('Failed to save: ' + err.message, 'danger');
  }
}

// ✅ Save school settings
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

// ✅ Helper: Adjust color brightness
function adjustColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// ✅ Helper: Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// ✅ Apply saved theme on page load
function applySavedTheme() {
  const savedColor = localStorage.getItem('themeColor');
  if (savedColor) {
    applyThemePreview(savedColor);
  }
}

// Apply theme immediately
applySavedTheme();

// Global exports
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
window.saveThemeColor = saveThemeColor;
window.selectThemeColor = selectThemeColor;
window.previewCustomColor = previewCustomColor;
window.applyCustomColor = applyCustomColor;
window.applyColorPicker = applyColorPicker;