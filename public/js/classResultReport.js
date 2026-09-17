// ==========================================
// CLASS RESULTS REPORT (With Top 10 Toppers & Multi-Page Print)
// ==========================================

async function loadClassResultReport() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Class Results Report';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
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

    // ✅ NEW: Top 10 Toppers Section
    const topToppers = data.topToppers || [];
    let toppersHtml = '';
    if (topToppers.length > 0) {
      const topperRows = topToppers.map(t => `
        <tr>
          <td class="text-center">
            <span class="badge bg-${t.rank === 1 ? 'warning' : t.rank === 2 ? 'secondary' : t.rank === 3 ? 'danger' : 'primary'} fs-6">
              #${t.rank}
            </span>
          </td>
          <td><strong>${t.student.fullName}</strong></td>
          <td class="text-center">${t.student.rollNo || 'N/A'}</td>
          <td class="text-center"><strong class="text-success fs-5">${t.percentage}%</strong></td>
          <td class="text-center"><span class="badge bg-success fs-6">${t.grade}</span></td>
          <td class="text-center">${t.totalMarks}/${t.totalMax}</td>
        </tr>
      `).join('');

      toppersHtml = `
        <div class="card shadow-sm mb-4 border-warning">
          <div class="card-header bg-warning text-dark">
            <h5 class="mb-0"><i class="bi bi-trophy-fill"></i> Top 10 Toppers</h5>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="text-center" style="width: 80px;">Rank</th>
                  <th>Student Name</th>
                  <th class="text-center">Roll No</th>
                  <th class="text-center">Percentage</th>
                  <th class="text-center">Grade</th>
                  <th class="text-center">Marks</th>
                </tr>
              </thead>
              <tbody>${topperRows}</tbody>
            </table>
          </div>
        </div>
      `;
    }

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
            <i class="bi bi-printer"></i> Print Full Report
          </button>
          <button class="btn btn-warning" onclick="printTopToppersOnly()">
            <i class="bi bi-trophy"></i> Print Top 10 Only
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

    container.innerHTML = summaryHtml + toppersHtml + actionsHtml + tableHtml;

    // Store data for printing
    window.currentClassReportData = data;
    window.currentClassReportSubjects = subjects;

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to generate report: ${err.message}</div>`;
  }
}

// ==========================================
// ✅ PRINT FUNCTION - Multi-Page with Top 10
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

  // ✅ NEW: Split students into chunks for multi-page handling (25 per page)
  const studentsPerPage = 25;
  const totalStudents = data.students.length;
  const totalPages = Math.ceil(totalStudents / studentsPerPage);
  
  let pagesHtml = '';
  
  for (let page = 0; page < totalPages; page++) {
    const startIdx = page * studentsPerPage;
    const endIdx = Math.min(startIdx + studentsPerPage, totalStudents);
    const pageStudents = data.students.slice(startIdx, endIdx);
    
    const studentRows = pageStudents.map((s, idx) => {
      const actualIndex = startIdx + idx;
      const subjectCells = subjects.map(sub => {
        const mark = s.subjectMarks[sub];
        if (!mark) return '<td class="center">-</td>';
        return `<td class="center">${mark.obtained}</td>`;
      }).join('');

      return `
        <tr>
          <td class="center">${actualIndex + 1}</td>
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

    // ✅ NEW: Top 10 Toppers on first page only
    let toppersSection = '';
    if (page === 0 && data.topToppers && data.topToppers.length > 0) {
      const topperRows = data.topToppers.map(t => `
        <tr>
          <td class="center">
            <strong style="color: ${t.rank === 1 ? '#d4af37' : t.rank === 2 ? '#757575' : t.rank === 3 ? '#cd7f32' : '#000'};">
              #${t.rank}
            </strong>
          </td>
          <td><strong>${t.student.fullName}</strong></td>
          <td class="center">${t.student.rollNo || '-'}</td>
          <td class="center"><strong>${t.percentage}%</strong></td>
          <td class="center"><strong>${t.grade}</strong></td>
          <td class="center">${t.totalMarks}/${t.totalMax}</td>
        </tr>
      `).join('');

      toppersSection = `
        <div class="toppers-section">
          <div class="toppers-title">🏆 TOP 10 TOPPERS</div>
          <table class="toppers-table">
            <thead>
              <tr>
                <th style="width: 50px;">Rank</th>
                <th>Student Name</th>
                <th style="width: 70px;">Roll No</th>
                <th style="width: 70px;">%</th>
                <th style="width: 60px;">Grade</th>
                <th style="width: 80px;">Marks</th>
              </tr>
            </thead>
            <tbody>${topperRows}</tbody>
          </table>
        </div>
      `;
    }

    // ✅ NEW: Summary section on last page only
    let summarySection = '';
    if (page === totalPages - 1) {
      summarySection = `
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
            <div class="summary-item"><span>Highest %:</span><strong>${summary.highestPercentage}%</strong></div>
            <div class="summary-item"><span>Lowest %:</span><strong>${summary.lowestPercentage}%</strong></div>
          </div>
        </div>

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
      `;
    }

    // ✅ NEW: Page number indicator
    const pageInfo = totalPages > 1 
      ? `<div class="page-info">Page ${page + 1} of ${totalPages}</div>` 
      : '';

    pagesHtml += `
      <div class="print-page ${page > 0 ? 'page-break' : ''}">
        ${page === 0 ? `
          <div class="header">
            <div class="school-name">${school.name}</div>
            ${school.address ? `<div class="school-info">${school.address}</div>` : ''}
            ${school.phone ? `<div class="school-info">Phone: ${school.phone}</div>` : ''}
            <div class="report-title">Class Result Sheet</div>
          </div>

          <div class="exam-info">
            <div><strong>Class:</strong> ${examInfo.className}</div>
            <div><strong>Exam:</strong> ${examInfo.examType}</div>
            <div><strong>Year:</strong> ${examInfo.examYear}</div>
            <div><strong>Academic Year:</strong> ${school.academicYear}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
          </div>

          ${toppersSection}
        ` : `
          <div class="continued-header">
            <div class="school-name-small">${school.name} - Class Result Sheet (Continued)</div>
            <div class="exam-info-small">${examInfo.examType} ${examInfo.examYear} - ${examInfo.className}</div>
          </div>
        `}

        <table class="results-table">
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

        ${summarySection}
        ${pageInfo}
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Class Result - ${data.examInfo.className} - ${data.examInfo.examType} ${data.examInfo.examYear}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Times New Roman', serif; 
          padding: 20px; 
          color: #000;
          background: #fff;
        }
        
        .print-page {
          margin-bottom: 20px;
        }
        
        .page-break {
          page-break-before: always;
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
        .school-name-small {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 5px;
        }
        .exam-info-small {
          text-align: center;
          font-size: 12px;
          margin-bottom: 10px;
          padding: 5px;
          background: #f5f5f5;
          border: 1px solid #000;
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
        
        /* Top 10 Toppers Section */
        .toppers-section {
          margin: 20px 0;
          border: 2px solid #d4af37;
          padding: 15px;
          background: #fffdf0;
          page-break-inside: avoid;
        }
        .toppers-title {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 10px;
          color: #b8860b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .toppers-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .toppers-table th {
          background: #d4af37;
          color: #fff;
          padding: 6px;
          text-align: center;
          border: 1px solid #b8860b;
        }
        .toppers-table td {
          border: 1px solid #d4af37;
          padding: 5px;
        }
        .toppers-table tbody tr:nth-child(1) { background: #fff9e6; }
        .toppers-table tbody tr:nth-child(2) { background: #f5f5f5; }
        .toppers-table tbody tr:nth-child(3) { background: #faebd7; }
        
        /* Results Table */
        .results-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;
          font-size: 12px;
        }
        .results-table th, 
        .results-table td { 
          border: 1px solid #000; 
          padding: 6px 4px; 
          text-align: left;
        }
        .results-table th { 
          background: #2c3e50; 
          color: #fff; 
          text-align: center; 
          font-weight: bold;
          text-transform: uppercase;
          font-size: 11px;
        }
        .center { text-align: center; }
        .results-table tbody tr:nth-child(even) { background: #f9f9f9; }
        
        /* Summary Section */
        .summary-section {
          margin: 20px 0;
          border: 2px solid #000;
          padding: 15px;
          page-break-inside: avoid;
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
          page-break-inside: avoid;
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

        .page-info {
          text-align: center;
          font-size: 11px;
          margin-top: 15px;
          color: #666;
          font-style: italic;
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
          .results-table { page-break-inside: auto; }
          .results-table tr { page-break-inside: avoid; page-break-after: auto; }
          .results-table thead { display: table-header-group; }
          .summary-section { page-break-inside: avoid; }
          .signatures { page-break-inside: avoid; }
          .toppers-section { page-break-inside: avoid; }
        }

        @page {
          size: A4 landscape;
          margin: 1cm;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}

      <div class="footer">
        This is a computer-generated result sheet. | Generated on ${new Date().toLocaleString()} | ${data.school.name}
      </div>

      <div class="no-print">
        <button onclick="window.print()">🖨️ Print Result Sheet</button>
        <button onclick="window.close()">✖ Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  showToast('Report ready for printing!', 'success');
}

// ==========================================
// ✅ NEW: Print Top 10 Toppers Only
// ==========================================
function printTopToppersOnly() {
  const data = window.currentClassReportData;
  if (!data || !data.topToppers || data.topToppers.length === 0) {
    return showToast('No toppers data available', 'warning');
  }

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) return showToast('Popup blocked!', 'warning');

  const school = data.school;
  const examInfo = data.examInfo;
  const summary = data.summary;

  const topperRows = data.topToppers.map(t => `
    <tr>
      <td class="center">
        <strong style="font-size: 16px; color: ${t.rank === 1 ? '#d4af37' : t.rank === 2 ? '#757575' : t.rank === 3 ? '#cd7f32' : '#000'};">
          ${t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : '#' + t.rank}
        </strong>
      </td>
      <td><strong style="font-size: 14px;">${t.student.fullName}</strong></td>
      <td class="center">${t.student.rollNo || '-'}</td>
      <td class="center"><strong style="font-size: 16px; color: #28a745;">${t.percentage}%</strong></td>
      <td class="center"><strong>${t.grade}</strong></td>
      <td class="center">${t.totalMarks}/${t.totalMax}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Top 10 Toppers - ${examInfo.className}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Times New Roman', serif; padding: 30px; }
        .header { text-align: center; border-bottom: 3px double #d4af37; padding-bottom: 15px; margin-bottom: 25px; }
        .school-name { font-size: 26px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
        .school-info { font-size: 12px; color: #555; margin: 3px 0; }
        .title { font-size: 22px; font-weight: bold; margin-top: 15px; color: #b8860b; text-transform: uppercase; letter-spacing: 1px; }
        .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
        
        .toppers-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        .toppers-table th { background: #d4af37; color: #fff; padding: 10px; text-align: center; border: 1px solid #b8860b; text-transform: uppercase; }
        .toppers-table td { border: 1px solid #d4af37; padding: 10px; }
        .center { text-align: center; }
        .toppers-table tbody tr:nth-child(1) { background: #fff9e6; }
        .toppers-table tbody tr:nth-child(2) { background: #f5f5f5; }
        .toppers-table tbody tr:nth-child(3) { background: #faebd7; }
        
        .stats-box { 
          margin: 25px 0; 
          padding: 15px; 
          border: 2px solid #d4af37; 
          background: #fffdf0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          text-align: center;
        }
        .stat-item { padding: 10px; border: 1px solid #d4af37; background: #fff; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .stat-value { font-size: 20px; font-weight: bold; color: #b8860b; margin-top: 5px; }
        
        .signatures { margin-top: 60px; display: flex; justify-content: space-around; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; font-size: 12px; }
        
        .no-print { text-align: center; margin: 20px 0; }
        .no-print button { padding: 10px 25px; margin: 0 5px; cursor: pointer; border: 1px solid #000; background: #fff; }
        
        @media print {
          .no-print { display: none !important; }
          body { padding: 15px; }
        }
        @page { size: A4 portrait; margin: 1.5cm; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">${school.name}</div>
        ${school.address ? `<div class="school-info">${school.address}</div>` : ''}
        ${school.phone ? `<div class="school-info">Phone: ${school.phone}</div>` : ''}
        <div class="title">🏆 Merit Certificate</div>
        <div class="subtitle">Top 10 Toppers - ${examInfo.examType} ${examInfo.examYear}</div>
        <div class="subtitle">Class: ${examInfo.className}</div>
      </div>

      <table class="toppers-table">
        <thead>
          <tr>
            <th style="width: 70px;">Rank</th>
            <th>Student Name</th>
            <th style="width: 80px;">Roll No</th>
            <th style="width: 90px;">Percentage</th>
            <th style="width: 70px;">Grade</th>
            <th style="width: 90px;">Marks</th>
          </tr>
        </thead>
        <tbody>${topperRows}</tbody>
      </table>

      <div class="stats-box">
        <div class="stat-item">
          <div class="stat-label">Total Students</div>
          <div class="stat-value">${summary.totalStudents}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Class Average</div>
          <div class="stat-value">${summary.classAverage}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Pass Percentage</div>
          <div class="stat-value">${summary.passPercentage}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Highest Score</div>
          <div class="stat-value">${summary.highestPercentage}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Students Passed</div>
          <div class="stat-value">${summary.passed}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Academic Year</div>
          <div class="stat-value" style="font-size: 14px;">${school.academicYear}</div>
        </div>
      </div>

      <div class="signatures">
        <div class="signature-box">
          <div class="signature-line">Class Teacher</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Principal</div>
        </div>
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
  showToast('Top 10 Toppers report ready!', 'success');
}

// Global Exports
window.loadClassResultReport = loadClassResultReport;
window.generateClassReport = generateClassReport;
window.printClassReport = printClassReport;
window.printTopToppersOnly = printTopToppersOnly;