async function loadIdCards() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'ID Cards';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/students?limit=100');
    const students = res.data || [];

    let rows = students.map(s => `
      <tr>
        <td><strong>${s.fullName}</strong><br><small class="text-muted">${s.class}</small></td>
        <td>${s.grNo || 'N/A'}</td>
        <td><button class="btn btn-sm btn-primary" onclick="generateIdCard('${s._id}')"><i class="bi bi-person-badge"></i> Generate ID</button></td>
      </tr>
    `).join('');

    main.innerHTML = `
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Student</th><th>GR No</th><th>Action</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="3" class="text-center text-muted">No students found</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

async function generateIdCard(studentId) {
  try {
    const res = await api.get(`/id-cards/student/${studentId}`);
    const { student, school } = res.data;

    const printWindow = window.open('', '_blank', 'width=500,height=350');
    if (!printWindow) return showToast('Popup blocked!', 'warning');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>ID Card</title>
      <style>
        body{margin:0;padding:20px;font-family:Arial,sans-serif;}
        .id-card{width:350px;height:220px;border:2px solid #004080;border-radius:10px;padding:15px;background:linear-gradient(135deg,#004080 0%,#0066cc 100%);color:white;position:relative;}
        .school-name{text-align:center;font-size:18px;font-weight:bold;border-bottom:1px solid white;padding-bottom:8px;margin-bottom:10px;}
        .photo{width:80px;height:80px;border:2px solid white;border-radius:5px;float:right;background:#ddd;}
        .info{margin-top:10px;}
        .info p{margin:3px 0;font-size:12px;}
        .info strong{font-size:13px;}
        @media print{body{padding:0;}.id-card{page-break-inside:avoid;}}
      </style>
    </head><body>
      <div class="id-card">
        <div class="school-name">${school.schoolName || 'School Name'}</div>
        ${student.imageURL ? `<img src="${student.imageURL}" class="photo" onerror="this.style.display='none'">` : '<div class="photo"></div>'}
        <div class="info">
          <p><strong>Name:</strong> ${student.fullName}</p>
          <p><strong>Class:</strong> ${student.class}</p>
          <p><strong>GR No:</strong> ${student.grNo || 'N/A'}</p>
          <p><strong>Father:</strong> ${student.fatherName}</p>
          <p><strong>Phone:</strong> ${student.phone || 'N/A'}</p>
        </div>
      </div>
      <div style="text-align:center;margin-top:20px;" class="no-print">
        <button onclick="window.print()">Print</button>
        <button onclick="window.close()">Close</button>
      </div>
    </body></html>`);
    printWindow.document.close();
  } catch (err) { showToast('Failed to generate ID: ' + err.message, 'danger'); }
}

window.loadIdCards = loadIdCards;
window.generateIdCard = generateIdCard;