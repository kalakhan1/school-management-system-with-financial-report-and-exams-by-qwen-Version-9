// ==========================================
// CLASS RESULTS REPORT (Print All Students)
// ==========================================

async function loadClassResultReport() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Class Results Report';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    // Fetch classes that have results
    const classesRes = await api.get('/class-results/classes-with-results');
    const classes = classesRes.data || [];

    if (classes.length === 0) {
      main.innerHTML = `
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle"></i> 
          No results have been generated yet. Please create result cards first.
        </div>
      `;
      return;
    }

    const classOptions = classes.map(c => `<option value="${c}">${c}</option>`).join('');
    const currentYear = new Date().getFullYear();

    main.innerHTML = `
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-white">
          <h5 class="mb-0"><i class="bi bi-funnel"></i> Filter Report</h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label fw-bold">Class *</label>
              <select id="crrClass" class="form-select" required>
                <option value="">-- Select Class --</option>
                ${classOptions}
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-bold">Exam Type *</label>
              <select id="crrExamType" class="form-select" required>
                <option value="">-- Select Exam --</option>
                <option value="Mid-Term">Mid-Term</option>
                <option value="Annual">Annual</option>
                <option value="Term">Term</option>
                <option value="Supplementary">Supplementary</option>
                <option value="Pre-Board">Pre-Board</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-bold">Year *</label>
              <input type="number" id="crrYear" class="form-control" value="${currentYear}" min="2000" max="2100">
            </div>
            <div class="col-md-1 d-flex align-items-end">
              <button class="btn btn-primary w-100" onclick="generateClassReport()" title="Generate Report">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="crrReportContainer">
        <div class="text-center text-muted p-5">
          <i class="bi bi-file-earmark-text" style="font-size: 3rem;"></i>
          <h5 class="mt-3">Select filters and click search to generate report</h5>
        </div>
      </div>
    `;
  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger">Failed to load: ${err.message}</div>`;
  }
}

async function generateClassReport() {
  const className = document.getElementById('crrClass').value;
  const examType = document.getElementById('crrExamType').value;
  const examYear = document.getElementById('crrYear').value;

  if (!className || !examType || !examYear) {
    return showToast('Please fill all filter fields', 'warning');
  }

  const container = document.getElementById('crrReportContainer');
  container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div><p class="mt-3">Generating report...</p></div>';

  try {
    const res = await api.get(`/class-results/report?className=${encodeURIComponent(className)}&examType=${encodeURIComponent(examType)}&examYear=${examYear}`);
    const data = res.data;

    if (!data.students || data.students.length === 0) {
      container.innerHTML = '<div class="alert alert-warning">No students found in this class.</div>';
      return;
    }

    // Build subjects header
    const subjects = data.subjects || [];
    const subjectHeaders = subjects.map(s => `<th class="text-center">${s}</th>`).join('');

    // Build student rows
    const studentRows = data.students.map((s, index) => {
      const subjectCells = subjects.map(sub => {
        const mark = s.subjectMarks[sub];
        if (!mark) return '<td class="text-center text-muted">-</td>';
        return `<td class="text-center"><strong>${mark.obtained}</strong><br><small class="text-muted">/${mark.total}</small></td>`;
      }).join('');

      const gradeBadge = s.grade.startsWith('A') ? 'success' : 
                         s.grade.startsWith('B') ? 'primary' : 
                         s.grade === 'F' ? 'danger' : 'secondary';

      const statusBadge = s.status === 'PASS' ? 'success' : 
                          s.status === 'FAIL' ? 'danger' : 'warning';

      return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${s.student.rollNo || 'N/A'}</td>
          <td><strong>${s.student.fullName}</strong></td>
          ${subjectCells}
          <td class="text-center"><strong>${s.totalMarks}/${s.totalMax}</strong></td>
          <td class="text-center"><strong class="text-primary">${s.percentage}%</strong></td>
          <td class="text-center"><span class="badge bg-${gradeBadge}">${s.grade}</span></td>
          <td class="text-center"><span class="badge bg-${statusBadge}">${s.status}</span></td>
        </tr>
      `;
    }).join('');

    // Summary cards
    const summary = data.summary;
    const summaryHtml = `
      <div class="row g-3 mb-4">
        <div class="col-md-2">
          <div class="card shadow-sm border-primary text-center p-2">
            <small class="text-muted">Total Students</small>
            <h4 class="text-primary mb-0">${summary.totalStudents}</h4>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card shadow-sm border-info text-center p-2">
            <small class="text-muted">Appeared</small>
            <h4 class="text-info mb-0">${summary.appeared}</h4>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card shadow-sm border-success text-center p-2">
            <small class="text-muted">Passed</small>
            <h4 class="text-success mb-0">${summary.passed}</h4>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card shadow-sm border-danger text-center p-2">
            <small class="text-muted">Failed</small>
            <h4 class="text-danger mb-0">${summary.failed}</h4>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card shadow-sm border-warning text-center p-2">
            <small class="text-muted">Class Avg</small>
            <h4 class="text-warning mb-0">${summary.classAverage}%</h4>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card shadow-sm border-dark text-center p-2">
            <small class="text-muted">Pass %</small>
            <h4 class="text-dark mb-0">${summary.passPercentage}%</h4>
          </div>
        </div>
      </div>
    `;

    // Action buttons
    const actionsHtml = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">
          <i class="bi bi-table"></i> ${data.examInfo.examType} ${data.examInfo.examYear} - ${data.examInfo.className}
        </h5>
        <div>
          <button class="btn btn-success me-2" onclick="printClassReport()">
            <i class="bi bi-printer"></i> Print Report
          </button>
        </div>
      </div>
    `;

    // Main table
    const tableHtml = `
      <div class="card shadow-sm">
        <div class="table-responsive">
          <table class="table table-bordered table-hover mb-0" id="classReportTable">
            <thead class="table-dark">
              <tr>
                <th class="text-center" style="width: 40px;">#</th>
                <th style="width: 80px;">Roll No</th>
                <th>Student Name</th>
                ${subjectHeaders}
                <th class="text-center" style="width: 100px;">Total</th>
                <th class="text-center" style="width: 80px;">%</th>
                <th class="text-center" style="width: 70px;">Grade</th>
                <th class="text-center" style="width: 80px;">Status</th>
              </tr>
            </thead>
            <tbody>${studentRows}</tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = summaryHtml + actionsHtml + tableHtml;

    // Store data for printing
    window.currentClassReportData = data;
    window.currentClassReportSubjects = subjects;

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to generate report: ${err.message}</div>`;
  }
}

// ==========================================
// PRINT FUNCTION - Professional Marksheet
// ==========================================
function printClassReport() {
  const data = window.currentClassReportData;
  const subjects = window.currentClassReportSubjects;

  if (!data || !subjects) {
    return showToast('Please generate report first', 'warning');
  }

  const printWindow = window.open('', '_blank', 'width=1000,height=700');
  if (!printWindow) {
    return showToast('Popup blocked! Please allow popups to print.', 'warning');
  }

  // Build subject headers for print
  const subjectHeaders = subjects.map(s => `<th>${s}</th>`).join('');

  // Build student rows for print
  const studentRows = data.students.map((s, index) => {
    const subjectCells = subjects.map(sub => {
      const mark = s.subjectMarks[sub];
      if (!mark) return '<td class="center">-</td>';
      return `<td class="center">${mark.obtained}</td>`;
    }).join('');

    return `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${s.student.rollNo || '-'}</td>
        <td>${s.student.fullName}</td>
        ${subjectCells}
        <td class="center"><strong>${s.totalMarks}</strong></td>
        <td class="center"><strong>${s.totalMax}</strong></td>
        <td class="center"><strong>${s.percentage}%</strong></td>
        <td class="center"><strong>${s.grade}</strong></td>
        <td class="center"><strong>${s.status}</strong></td>
      </tr>
    `;
  }).join('');

  const summary = data.summary;
  const school = data.school;
  const examInfo = data.examInfo;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Class Result - ${examInfo.className} - ${examInfo.examType} ${examInfo.examYear}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Times New Roman', serif; 
          padding: 20px; 
          color: #000;
          background: #fff;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px double #000; 
          padding-bottom: 15px; 
          margin-bottom: 20px; 
        }
        .school-name { 
          font-size: 28px; 
          font-weight: bold; 
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 5px;
        }
        .school-info { 
          font-size: 12px; 
          color: #333; 
          margin: 3px 0; 
        }
        .report-title { 
          font-size: 20px; 
          font-weight: bold; 
          margin-top: 15px;
          text-decoration: underline;
          text-transform: uppercase;
        }
        .exam-info {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
          font-size: 14px;
          border: 1px solid #000;
          padding: 8px 15px;
          background: #f5f5f5;
        }
        .exam-info div strong { 
          text-transform: uppercase; 
        }
        
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;
          font-size: 12px;
        }
        th, td { 
          border: 1px solid #000; 
          padding: 6px 4px; 
          text-align: left;
        }
        th { 
          background: #2c3e50; 
          color: #fff; 
          text-align: center; 
          font-weight: bold;
          text-transform: uppercase;
          font-size: 11px;
        }
        .center { text-align: center; }
        tbody tr:nth-child(even) { background: #f9f9f9; }
        
        .summary-section {
          margin: 20px 0;
          border: 2px solid #000;
          padding: 15px;
        }
        .summary-title {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 10px;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
          padding-bottom: 5px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          font-size: 13px;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 8px;
          border: 1px solid #ccc;
          background: #fafafa;
        }
        .summary-item strong {
          color: #2c3e50;
        }

        .signatures {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 40px;
          padding-top: 5px;
          font-size: 12px;
        }

        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #ccc;
          padding-top: 10px;
        }

        .no-print { 
          text-align: center; 
          margin: 20px 0;
        }
        .no-print button {
          padding: 10px 25px;
          margin: 0 5px;
          font-size: 14px;
          cursor: pointer;
          border: 1px solid #000;
          background: #fff;
        }
        .no-print button:hover {
          background: #f0f0f0;
        }

        @media print {
          body { padding: 10px; }
          .no-print { display: none !important; }
          .header { page-break-before: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          .summary-section { page-break-inside: avoid; }
          .signatures { page-break-inside: avoid; }
        }

        @page {
          size: A4 landscape;
          margin: 1cm;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="school-name">${school.name}</div>
        ${school.address ? `<div class="school-info">${school.address}</div>` : ''}
        ${school.phone ? `<div class="school-info">Phone: ${school.phone}</div>` : ''}
        <div class="report-title">Class Result Sheet</div>
      </div>

      <!-- Exam Info -->
      <div class="exam-info">
        <div><strong>Class:</strong> ${examInfo.className}</div>
        <div><strong>Exam:</strong> ${examInfo.examType}</div>
        <div><strong>Year:</strong> ${examInfo.examYear}</div>
        <div><strong>Academic Year:</strong> ${school.academicYear}</div>
        <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
      </div>

      <!-- Results Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 30px;">S.No</th>
            <th style="width: 60px;">Roll No</th>
            <th>Student Name</th>
            ${subjectHeaders}
            <th style="width: 50px;">Obt</th>
            <th style="width: 50px;">Total</th>
            <th style="width: 50px;">%</th>
            <th style="width: 50px;">Grade</th>
            <th style="width: 60px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${studentRows}
        </tbody>
      </table>

      <!-- Summary Section -->
      <div class="summary-section">
        <div class="summary-title">Statistical Summary</div>
        <div class="summary-grid">
          <div class="summary-item"><span>Total Students:</span><strong>${summary.totalStudents}</strong></div>
          <div class="summary-item"><span>Appeared:</span><strong>${summary.appeared}</strong></div>
          <div class="summary-item"><span>Absent/No Result:</span><strong>${summary.noResult}</strong></div>
          <div class="summary-item"><span>Passed:</span><strong>${summary.passed}</strong></div>
          <div class="summary-item"><span>Failed:</span><strong>${summary.failed}</strong></div>
          <div class="summary-item"><span>Pass Percentage:</span><strong>${summary.passPercentage}%</strong></div>
          <div class="summary-item"><span>Class Average:</span><strong>${summary.classAverage}%</strong></div>
          <div class="summary-item"><span>Highest %:</span><strong>${data.students.length > 0 ? Math.max(...data.students.filter(s => s.status !== 'Result Not Generated').map(s => s.percentage)).toFixed(2) + '%' : 'N/A'}</strong></div>
          <div class="summary-item"><span>Lowest %:</span><strong>${data.students.length > 0 ? Math.min(...data.students.filter(s => s.status !== 'Result Not Generated' && s.percentage > 0).map(s => s.percentage)).toFixed(2) + '%' : 'N/A'}</strong></div>
        </div>
      </div>

      <!-- Signatures -->
      <div class="signatures">
        <div class="signature-box">
          <div class="signature-line">Class Teacher</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Exam Coordinator</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Principal</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        This is a computer-generated result sheet. | Generated on ${new Date().toLocaleString()} | ${school.name}
      </div>

      <!-- Print Buttons -->
      <div class="no-print">
        <button onclick="window.print()">🖨️ Print Result Sheet</button>
        <button onclick="window.close()">✖ Close</button>
      </div>

      <script>
        // Auto-focus for printing
        window.onload = function() {
          setTimeout(() => {
            if (confirm('Do you want to print this result sheet now?')) {
              window.print();
            }
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  showToast('Report ready for printing!', 'success');
}

// Global Exports
window.loadClassResultReport = loadClassResultReport;
window.generateClassReport = generateClassReport;
window.printClassReport = printClassReport;