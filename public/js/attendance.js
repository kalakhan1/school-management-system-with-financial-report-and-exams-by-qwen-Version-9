// ==========================================
// ATTENDANCE MANAGEMENT SYSTEM
// ==========================================

let currentAttendanceTab = 'student';
let currentAttendanceDate = new Date().toISOString().split('T')[0];
let currentAttendanceClass = '';

async function loadAttendance() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Attendance Management';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    // Fetch classes for filter
    let classes = [];
    try {
      const classesRes = await api.get('/attendance/classes');
      classes = classesRes.data || [];
    } catch (err) { /* ignore */ }

    const classOptions = classes.map(c => `<option value="${c}">${c}</option>`).join('');

    main.innerHTML = `
      <!-- Tabs -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <button class="nav-link active" id="tabStudent" onclick="switchAttendanceTab('student')">
            <i class="bi bi-mortarboard"></i> Student Attendance
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" id="tabTeacher" onclick="switchAttendanceTab('teacher')">
            <i class="bi bi-person-video2"></i> Teacher Attendance
          </button>
        </li>
        <li class="nav-item ms-auto">
          <button class="nav-link" onclick="loadAttendanceReport()">
            <i class="bi bi-graph-up"></i> Monthly Report
          </button>
        </li>
      </ul>

      <!-- Filters -->
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label fw-bold">Date *</label>
              <input type="date" id="attDate" class="form-control" value="${currentAttendanceDate}" onchange="updateAttendanceDate(this.value)">
            </div>
            <div class="col-md-3" id="classFilterContainer">
              <label class="form-label fw-bold">Class</label>
              <select id="attClass" class="form-select" onchange="updateAttendanceClass(this.value)">
                <option value="">All Classes</option>
                ${classOptions}
              </select>
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <button class="btn btn-primary w-100" onclick="loadAttendanceForDate()">
                <i class="bi bi-search"></i> Load Attendance
              </button>
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <button class="btn btn-success w-100" onclick="markAllPresent()">
                <i class="bi bi-check-all"></i> Mark All Present
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Content -->
      <div id="attendanceContent">
        <div class="text-center text-muted p-5">
          <i class="bi bi-calendar-check" style="font-size: 3rem;"></i>
          <h5 class="mt-3">Select date and class, then click "Load Attendance"</h5>
        </div>
      </div>
    `;

    // Auto-load today's attendance
    loadAttendanceForDate();
  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger">Failed to load: ${err.message}</div>`;
  }
}

function switchAttendanceTab(tab) {
  currentAttendanceTab = tab;
  document.getElementById('tabStudent').classList.toggle('active', tab === 'student');
  document.getElementById('tabTeacher').classList.toggle('active', tab === 'teacher');
  
  // Show/hide class filter
  document.getElementById('classFilterContainer').style.display = tab === 'student' ? 'block' : 'none';
  
  loadAttendanceForDate();
}

function updateAttendanceDate(date) {
  currentAttendanceDate = date;
}

function updateAttendanceClass(className) {
  currentAttendanceClass = className;
}

async function loadAttendanceForDate() {
  const content = document.getElementById('attendanceContent');
  content.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    let url = `/attendance/date/${currentAttendanceDate}?type=${currentAttendanceTab}`;
    if (currentAttendanceTab === 'student' && currentAttendanceClass) {
      url += `&className=${encodeURIComponent(currentAttendanceClass)}`;
    }

    const res = await api.get(url);
    const data = res.data;

    if (data.records.length === 0) {
      content.innerHTML = `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> 
          No ${currentAttendanceTab}s found${currentAttendanceClass ? ` in ${currentAttendanceClass}` : ''}.
        </div>
      `;
      return;
    }

    // Summary cards
    const summary = data.summary;
    const summaryHtml = `
      <div class="row g-2 mb-3">
        <div class="col"><div class="card border-primary text-center p-2"><small>Total</small><h5 class="mb-0 text-primary">${summary.total}</h5></div></div>
        <div class="col"><div class="card border-success text-center p-2"><small>Present</small><h5 class="mb-0 text-success">${summary.present}</h5></div></div>
        <div class="col"><div class="card border-danger text-center p-2"><small>Absent</small><h5 class="mb-0 text-danger">${summary.absent}</h5></div></div>
        <div class="col"><div class="card border-warning text-center p-2"><small>Late</small><h5 class="mb-0 text-warning">${summary.late}</h5></div></div>
        <div class="col"><div class="card border-info text-center p-2"><small>Leave</small><h5 class="mb-0 text-info">${summary.leave}</h5></div></div>
        <div class="col"><div class="card border-secondary text-center p-2"><small>Unmarked</small><h5 class="mb-0 text-secondary">${summary.unmarked}</h5></div></div>
      </div>
    `;

    // Table rows
    const rows = data.records.map((r, index) => {
      const statusSelect = `
        <select class="form-select form-select-sm att-status" data-index="${index}" data-person-id="${r.personId}">
          <option value="">-- Select --</option>
          <option value="Present" ${r.status === 'Present' ? 'selected' : ''}>Present</option>
          <option value="Absent" ${r.status === 'Absent' ? 'selected' : ''}>Absent</option>
          <option value="Late" ${r.status === 'Late' ? 'selected' : ''}>Late</option>
          <option value="Leave" ${r.status === 'Leave' ? 'selected' : ''}>Leave</option>
        </select>
      `;

      return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${r.identifier}</td>
          <td><strong>${r.name}</strong></td>
          ${currentAttendanceTab === 'student' ? `<td>${r.class || 'N/A'}</td>` : ''}
          <td style="width: 150px;">${statusSelect}</td>
          <td><input type="text" class="form-control form-control-sm att-remarks" data-index="${index}" value="${r.remarks || ''}" placeholder="Remarks"></td>
          <td class="text-center">
            ${r.marked ? '<span class="badge bg-success">Marked</span>' : '<span class="badge bg-secondary">Pending</span>'}
          </td>
        </tr>
      `;
    }).join('');

    content.innerHTML = `
      ${summaryHtml}
      <div class="card shadow-sm">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            ${currentAttendanceTab === 'student' ? 'Students' : 'Teachers'} - ${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            ${data.className ? ` (${data.className})` : ''}
          </h5>
          <div>
            <button class="btn btn-success btn-sm me-2" onclick="saveAttendance()">
              <i class="bi bi-save"></i> Save Attendance
            </button>
            <button class="btn btn-primary btn-sm" onclick="printAttendanceSheet()">
              <i class="bi bi-printer"></i> Print
            </button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0" id="attendanceTable">
            <thead class="table-light">
              <tr>
                <th class="text-center" style="width: 50px;">#</th>
                <th style="width: 100px;">${currentAttendanceTab === 'student' ? 'Roll/GR' : 'Emp Code'}</th>
                <th>Name</th>
                ${currentAttendanceTab === 'student' ? '<th>Class</th>' : ''}
                <th style="width: 150px;">Status</th>
                <th>Remarks</th>
                <th class="text-center" style="width: 100px;">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;

    // Store data for saving
    window.currentAttendanceData = data;
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger">Failed to load: ${err.message}</div>`;
  }
}

function markAllPresent() {
  const selects = document.querySelectorAll('.att-status');
  if (selects.length === 0) return showToast('No records to mark', 'warning');
  
  if (!confirm(`Mark all ${selects.length} ${currentAttendanceTab}s as PRESENT?`)) return;
  
  selects.forEach(select => {
    select.value = 'Present';
  });
  showToast('All marked as Present. Click "Save Attendance" to confirm.', 'info');
}

async function saveAttendance() {
  const selects = document.querySelectorAll('.att-status');
  if (selects.length === 0) return showToast('No records to save', 'warning');

  const records = [];
  selects.forEach(select => {
    const status = select.value;
    if (!status) return;
    
    const personId = select.dataset.personId;
    const index = select.dataset.index;
    const remarksEl = document.querySelector(`.att-remarks[data-index="${index}"]`);
    const remarks = remarksEl ? remarksEl.value : '';

    records.push({
      personId,
      status,
      remarks
    });
  });

  if (records.length === 0) {
    return showToast('Please mark at least one person', 'warning');
  }

  const data = {
    type: currentAttendanceTab,
    date: currentAttendanceDate,
    className: currentAttendanceTab === 'student' ? currentAttendanceClass : null,
    records
  };

  try {
    showToast('Saving attendance...', 'info');
    const res = await api.post('/attendance/mark', data);
    showToast(res.message || 'Attendance saved successfully!', 'success');
    loadAttendanceForDate(); // Reload to refresh status
  } catch (err) {
    showToast('Failed to save: ' + err.message, 'danger');
  }
}

// ==========================================
// MONTHLY ATTENDANCE REPORT
// ==========================================

async function loadAttendanceReport() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Attendance Monthly Report';

  try {
    let classes = [];
    try {
      const classesRes = await api.get('/attendance/classes');
      classes = classesRes.data || [];
    } catch (err) { /* ignore */ }

    const classOptions = classes.map(c => `<option value="${c}">${c}</option>`).join('');
    const currentDate = new Date();
    const months = Array.from({ length: 12 }, (_, i) => 
      `<option value="${i}" ${i === currentDate.getMonth() ? 'selected' : ''}>${new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>`
    ).join('');

    main.innerHTML = `
      <button class="btn btn-outline-secondary mb-3" onclick="loadAttendance()">
        <i class="bi bi-arrow-left"></i> Back to Marking
      </button>

      <div class="card shadow-sm mb-4">
        <div class="card-header bg-white"><h5 class="mb-0"><i class="bi bi-funnel"></i> Report Filters</h5></div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label fw-bold">Type *</label>
              <select id="repType" class="form-select">
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
              </select>
            </div>
            <div class="col-md-3" id="repClassContainer">
              <label class="form-label fw-bold">Class</label>
              <select id="repClass" class="form-select">
                <option value="">All Classes</option>
                ${classOptions}
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-bold">Month *</label>
              <select id="repMonth" class="form-select">${months}</select>
            </div>
            <div class="col-md-2">
              <label class="form-label fw-bold">Year *</label>
              <input type="number" id="repYear" class="form-control" value="${currentDate.getFullYear()}" min="2000" max="2100">
            </div>
            <div class="col-md-1 d-flex align-items-end">
              <button class="btn btn-primary w-100" onclick="generateAttendanceReport()">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="reportContent">
        <div class="text-center text-muted p-5">
          <i class="bi bi-bar-chart" style="font-size: 3rem;"></i>
          <h5 class="mt-3">Select filters and click search to generate report</h5>
        </div>
      </div>
    `;

    // Toggle class filter based on type
    document.getElementById('repType').addEventListener('change', function() {
      document.getElementById('repClassContainer').style.display = this.value === 'student' ? 'block' : 'none';
    });
  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger">Failed to load: ${err.message}</div>`;
  }
}

async function generateAttendanceReport() {
  const type = document.getElementById('repType').value;
  const className = document.getElementById('repClass').value;
  const month = document.getElementById('repMonth').value;
  const year = document.getElementById('repYear').value;

  const content = document.getElementById('reportContent');
  content.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    let url = `/attendance/report?type=${type}&month=${month}&year=${year}`;
    if (type === 'student' && className) url += `&className=${encodeURIComponent(className)}`;

    const res = await api.get(url);
    const data = res.data;

    if (data.report.length === 0) {
      content.innerHTML = '<div class="alert alert-info">No attendance records found for this period.</div>';
      return;
    }

    const rows = data.report.map((r, i) => {
      const percentageColor = r.percentage >= 75 ? 'success' : r.percentage >= 50 ? 'warning' : 'danger';
      return `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td><strong>${r.name}</strong></td>
          ${type === 'student' ? `<td>${r.class || 'N/A'}</td>` : ''}
          <td class="text-center text-success">${r.Present}</td>
          <td class="text-center text-danger">${r.Absent}</td>
          <td class="text-center text-warning">${r.Late}</td>
          <td class="text-center text-info">${r.Leave}</td>
          <td class="text-center"><strong>${r.total}</strong></td>
          <td class="text-center"><span class="badge bg-${percentageColor} fs-6">${r.percentage}%</span></td>
        </tr>
      `;
    }).join('');

    content.innerHTML = `
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card shadow-sm border-primary text-center p-3">
            <small class="text-muted">Total ${type === 'student' ? 'Students' : 'Teachers'}</small>
            <h3 class="text-primary mb-0">${data.summary.totalPeople}</h3>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card shadow-sm border-info text-center p-3">
            <small class="text-muted">Total Records</small>
            <h3 class="text-info mb-0">${data.summary.totalRecords}</h3>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card shadow-sm border-success text-center p-3">
            <small class="text-muted">Average Attendance</small>
            <h3 class="text-success mb-0">${data.summary.avgPercentage}%</h3>
          </div>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0">${data.monthName} ${data.year} - ${type === 'student' ? 'Student' : 'Teacher'} Attendance Report ${data.className ? `(${data.className})` : ''}</h5>
          <button class="btn btn-primary btn-sm" onclick="printAttendanceReport()">
            <i class="bi bi-printer"></i> Print Report
          </button>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0" id="attendanceReportTable">
            <thead class="table-dark">
              <tr>
                <th class="text-center">#</th>
                <th>Name</th>
                ${type === 'student' ? '<th>Class</th>' : ''}
                <th class="text-center">Present</th>
                <th class="text-center">Absent</th>
                <th class="text-center">Late</th>
                <th class="text-center">Leave</th>
                <th class="text-center">Total Days</th>
                <th class="text-center">Percentage</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;

    window.currentAttendanceReportData = data;
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger">Failed to generate report: ${err.message}</div>`;
  }
}

// ==========================================
// PRINT FUNCTIONS
// ==========================================

function printAttendanceSheet() {
  const data = window.currentAttendanceData;
  if (!data) return showToast('No data to print', 'warning');

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return showToast('Popup blocked!', 'warning');

  const rows = data.records.map((r, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${r.identifier}</td>
      <td>${r.name}</td>
      ${currentAttendanceTab === 'student' ? `<td>${r.class || '-'}</td>` : ''}
      <td class="center"><strong>${r.status || 'Not Marked'}</strong></td>
      <td>${r.remarks || '-'}</td>
    </tr>
  `).join('');

  const summary = data.summary;
  const dateStr = new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance Sheet - ${dateStr}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 15px; margin-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; }
        .title { font-size: 18px; font-weight: bold; margin-top: 10px; text-decoration: underline; }
        .info { display: flex; justify-content: space-between; margin: 15px 0; font-size: 14px; border: 1px solid #000; padding: 10px; background: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background: #2c3e50; color: #fff; text-align: center; text-transform: uppercase; font-size: 12px; }
        .center { text-align: center; }
        tbody tr:nth-child(even) { background: #f9f9f9; }
        .summary { margin: 20px 0; border: 2px solid #000; padding: 15px; }
        .summary-title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 10px; text-transform: uppercase; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .summary-item { display: flex; justify-content: space-between; padding: 5px 10px; border: 1px solid #ccc; background: #fafafa; }
        .signatures { margin-top: 60px; display: flex; justify-content: space-around; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; }
        .no-print { text-align: center; margin: 20px 0; }
        .no-print button { padding: 10px 25px; margin: 0 5px; cursor: pointer; }
        @media print {
          .no-print { display: none !important; }
          body { padding: 10px; }
          @page { size: A4; margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">School ERP</div>
        <div class="title">${currentAttendanceTab === 'student' ? 'Student' : 'Teacher'} Attendance Sheet</div>
      </div>
      <div class="info">
        <div><strong>Date:</strong> ${dateStr}</div>
        <div><strong>Type:</strong> ${currentAttendanceTab === 'student' ? 'Students' : 'Teachers'}</div>
        ${data.className ? `<div><strong>Class:</strong> ${data.className}</div>` : ''}
        <div><strong>Total:</strong> ${summary.total}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">S.No</th>
            <th style="width: 80px;">${currentAttendanceTab === 'student' ? 'Roll/GR' : 'Emp Code'}</th>
            <th>Name</th>
            ${currentAttendanceTab === 'student' ? '<th>Class</th>' : ''}
            <th style="width: 100px;">Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">
        <div class="summary-title">Attendance Summary</div>
        <div class="summary-grid">
          <div class="summary-item"><span>Present:</span><strong>${summary.present}</strong></div>
          <div class="summary-item"><span>Absent:</span><strong>${summary.absent}</strong></div>
          <div class="summary-item"><span>Late:</span><strong>${summary.late}</strong></div>
          <div class="summary-item"><span>On Leave:</span><strong>${summary.leave}</strong></div>
          <div class="summary-item"><span>Unmarked:</span><strong>${summary.unmarked}</strong></div>
          <div class="summary-item"><span>Total:</span><strong>${summary.total}</strong></div>
        </div>
      </div>
      <div class="signatures">
        <div class="signature-box"><div class="signature-line">Class Teacher / Supervisor</div></div>
        <div class="signature-box"><div class="signature-line">Principal</div></div>
      </div>
      <div class="no-print">
        <button onclick="window.print()">🖨️ Print</button>
        <button onclick="window.close()">✖ Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

function printAttendanceReport() {
  const data = window.currentAttendanceReportData;
  if (!data) return showToast('Generate report first', 'warning');

  const printWindow = window.open('', '_blank', 'width=1000,height=700');
  if (!printWindow) return showToast('Popup blocked!', 'warning');

  const rows = data.report.map((r, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${r.name}</td>
      ${data.type === 'student' ? `<td>${r.class || '-'}</td>` : ''}
      <td class="center">${r.Present}</td>
      <td class="center">${r.Absent}</td>
      <td class="center">${r.Late}</td>
      <td class="center">${r.Leave}</td>
      <td class="center"><strong>${r.total}</strong></td>
      <td class="center"><strong>${r.percentage}%</strong></td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance Report - ${data.monthName} ${data.year}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 15px; margin-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; }
        .title { font-size: 18px; font-weight: bold; margin-top: 10px; text-decoration: underline; }
        .info { display: flex; justify-content: space-between; margin: 15px 0; font-size: 14px; border: 1px solid #000; padding: 10px; background: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; }
        th { background: #2c3e50; color: #fff; text-align: center; font-size: 11px; }
        .center { text-align: center; }
        tbody tr:nth-child(even) { background: #f9f9f9; }
        .summary { margin: 20px 0; border: 2px solid #000; padding: 15px; }
        .summary-title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 10px; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .summary-item { padding: 8px; border: 1px solid #ccc; background: #fafafa; text-align: center; }
        .signatures { margin-top: 60px; display: flex; justify-content: space-around; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; }
        .no-print { text-align: center; margin: 20px 0; }
        .no-print button { padding: 10px 25px; margin: 0 5px; cursor: pointer; }
        @media print {
          .no-print { display: none !important; }
          body { padding: 10px; }
          @page { size: A4 landscape; margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">School ERP</div>
        <div class="title">${data.type === 'student' ? 'Student' : 'Teacher'} Attendance Report</div>
      </div>
      <div class="info">
        <div><strong>Month:</strong> ${data.monthName} ${data.year}</div>
        <div><strong>Type:</strong> ${data.type === 'student' ? 'Students' : 'Teachers'}</div>
        ${data.className ? `<div><strong>Class:</strong> ${data.className}</div>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>Name</th>
            ${data.type === 'student' ? '<th>Class</th>' : ''}
            <th>Present</th>
            <th>Absent</th>
            <th>Late</th>
            <th>Leave</th>
            <th>Total</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">
        <div class="summary-title">Report Summary</div>
        <div class="summary-grid">
          <div class="summary-item"><strong>Total ${data.type === 'student' ? 'Students' : 'Teachers'}</strong><br>${data.summary.totalPeople}</div>
          <div class="summary-item"><strong>Total Records</strong><br>${data.summary.totalRecords}</div>
          <div class="summary-item"><strong>Average Attendance</strong><br>${data.summary.avgPercentage}%</div>
        </div>
      </div>
      <div class="signatures">
        <div class="signature-box"><div class="signature-line">Prepared By</div></div>
        <div class="signature-box"><div class="signature-line">Verified By</div></div>
        <div class="signature-box"><div class="signature-line">Principal</div></div>
      </div>
      <div class="no-print">
        <button onclick="window.print()">🖨️ Print</button>
        <button onclick="window.close()">✖ Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// Global Exports
window.loadAttendance = loadAttendance;
window.switchAttendanceTab = switchAttendanceTab;
window.updateAttendanceDate = updateAttendanceDate;
window.updateAttendanceClass = updateAttendanceClass;
window.loadAttendanceForDate = loadAttendanceForDate;
window.markAllPresent = markAllPresent;
window.saveAttendance = saveAttendance;
window.loadAttendanceReport = loadAttendanceReport;
window.generateAttendanceReport = generateAttendanceReport;
window.printAttendanceSheet = printAttendanceSheet;
window.printAttendanceReport = printAttendanceReport;