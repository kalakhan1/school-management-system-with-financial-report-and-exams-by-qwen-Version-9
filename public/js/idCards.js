async function loadIdCards() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'ID Cards';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/students?limit=100');
    const students = res.data || [];

    let rows = students.map(s => `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            ${s.imageURL 
              ? `<img src="${s.imageURL}" alt="${s.fullName}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:10px;border:2px solid #dee2e6;" onerror="this.style.display='none'">`
              : `<div style="width:40px;height:40px;border-radius:50%;background:#e9ecef;margin-right:10px;display:flex;align-items:center;justify-content:center;"><i class="bi bi-person-fill text-muted"></i></div>`
            }
            <div>
              <strong>${s.fullName}</strong><br>
              <small class="text-muted">${s.class} • ${s.grNo || 'N/A'}</small>
            </div>
          </div>
        </td>
        <td>${s.grNo || 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="generateIdCard('${s._id}')">
            <i class="bi bi-person-badge"></i> Generate ID
          </button>
        </td>
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
    const [resStudent, resSettings] = await Promise.all([
      api.get(`/id-cards/student/${studentId}`),
      api.get('/settings').catch(() => ({ data: { schoolName: 'School Name', themeColor: '#0d6efd' } }))
    ]);
    
    const { student, school } = resStudent.data;
    const themeColor = resSettings.data?.themeColor || localStorage.getItem('themeColor') || '#0d6efd';
    const lighterColor = adjustColor(themeColor, 30);
    const schoolName = school.schoolName || resSettings.data?.schoolName || 'School Name';

    // ✅ Prepare QR code data
    const qrData = JSON.stringify({
      name: student.fullName,
      class: student.class,
      grNo: student.grNo || 'N/A',
      father: student.fatherName,
      phone: student.phone || 'N/A',
      school: schoolName
    });

    const printWindow = window.open('', '_blank', 'width=600,height=450');
    if (!printWindow) return showToast('Popup blocked!', 'warning');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>ID Card - ${student.fullName}</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 30px;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    
    .id-card {
      width: 400px;
      height: 250px;
      border: 3px solid ${themeColor};
      border-radius: 15px;
      padding: 20px;
      background: linear-gradient(135deg, ${themeColor} 0%, ${lighterColor} 100%);
      color: white;
      position: relative;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
    }
    
    .card-header {
      text-align: center;
      border-bottom: 2px solid rgba(255, 255, 255, 0.3);
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    
    .school-name {
      font-size: 20px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .card-title {
      font-size: 12px;
      margin-top: 5px;
      opacity: 0.9;
      letter-spacing: 2px;
    }
    
    .card-body {
      display: flex;
      gap: 15px;
      flex: 1;
    }
    
    .photo-section {
      flex-shrink: 0;
    }
    
    .photo {
      width: 90px;
      height: 90px;
      border: 3px solid white;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.2);
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .info-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 1.4;
    }
    
    .info-label {
      font-weight: 600;
      min-width: 70px;
      opacity: 0.9;
    }
    
    .info-value {
      flex: 1;
      font-weight: 500;
    }
    
    .qr-section {
      position: absolute;
      bottom: 15px;
      right: 15px;
      background: white;
      padding: 5px;
      border-radius: 5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    #qrcode {
      width: 70px;
      height: 70px;
    }
    
    #qrcode img, #qrcode canvas {
      width: 70px !important;
      height: 70px !important;
    }
    
    .card-footer {
      position: absolute;
      bottom: 10px;
      left: 20px;
      font-size: 10px;
      opacity: 0.8;
      letter-spacing: 1px;
    }
    
    .no-print {
      text-align: center;
      margin-top: 30px;
    }
    
    .no-print button {
      padding: 10px 25px;
      margin: 0 5px;
      font-size: 14px;
      cursor: pointer;
      border: 1px solid #000;
      background: #fff;
      border-radius: 5px;
      transition: all 0.3s ease;
    }
    
    .no-print button:hover {
      background: #f0f0f0;
      transform: translateY(-2px);
    }
    
    @media print {
      body {
        padding: 0;
        background: white;
      }
      .no-print {
        display: none !important;
      }
      .id-card {
        page-break-inside: avoid;
        box-shadow: none;
      }
    }
    
    @page {
      size: A6 landscape;
      margin: 1cm;
    }
  </style>
</head>
<body>
  <div class="id-card">
    <div class="card-header">
      <div class="school-name">${schoolName}</div>
      <div class="card-title">STUDENT IDENTITY CARD</div>
    </div>
    
    <div class="card-body">
      <div class="photo-section">
        ${student.imageURL 
          ? `<img src="${student.imageURL}" class="photo" onerror="this.style.display='none'">`
          : '<div class="photo"></div>'
        }
      </div>
      
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${student.fullName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Class:</span>
          <span class="info-value">${student.class}</span>
        </div>
        <div class="info-row">
          <span class="info-label">GR No:</span>
          <span class="info-value">${student.grNo || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Father:</span>
          <span class="info-value">${student.fatherName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phone:</span>
          <span class="info-value">${student.phone || 'N/A'}</span>
        </div>
      </div>
    </div>
    
    <div class="qr-section">
      <div id="qrcode"></div>
    </div>
    
    <div class="card-footer">
      Valid Until: ${new Date(new Date().getFullYear() + 1, 11, 31).toLocaleDateString()}
    </div>
  </div>
  
  <div class="no-print">
    <button onclick="window.print()">🖨️ Print ID Card</button>
    <button onclick="window.close()">✖ Close</button>
  </div>
  
  <script>
    // Generate QR Code
    window.onload = function() {
      try {
        new QRCode(document.getElementById("qrcode"), {
          text: ${JSON.stringify(qrData)},
          width: 70,
          height: 70,
          colorDark: "${themeColor}",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (err) {
        console.error('QR Code generation failed:', err);
        document.getElementById('qrcode').innerHTML = '<div style="font-size:10px;text-align:center;color:#999;">QR Error</div>';
      }
    };
  <\/script>
</body>
</html>`);
    
    printWindow.document.close();
    showToast('ID Card generated with QR code!', 'success');
  } catch (err) { 
    showToast('Failed to generate ID: ' + err.message, 'danger'); 
  }
}

// Helper: Adjust color brightness
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

window.loadIdCards = loadIdCards;
window.generateIdCard = generateIdCard;