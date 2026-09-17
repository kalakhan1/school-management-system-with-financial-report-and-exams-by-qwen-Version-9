async function loadFeeReminders() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Fee Reminders';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/fee-reminders/outstanding');
    const students = res.data || [];

    let totalOutstanding = 0;
    students.forEach(s => totalOutstanding += s.feeData.outstanding || 0);

    let rows = students.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${s.student.fullName}</strong><br><small class="text-muted">${s.student.class}</small></td>
        <td>Rs. ${s.feeData.netFee.toLocaleString()}</td>
        <td>Rs. ${s.feeData.totalPaid.toLocaleString()}</td>
        <td><strong class="text-danger">Rs. ${s.feeData.outstanding.toLocaleString()}</strong></td>
        <td><button class="btn btn-sm btn-success" onclick="sendWhatsAppReminder('${s.student._id}', '${s.student.fullName}', '${s.student.class}', ${s.feeData.outstanding}, '${s.student.phone || ''}')"><i class="bi bi-whatsapp"></i> Send</button></td>
      </tr>
    `).join('');

    main.innerHTML = `
      <div class="row g-3 mb-4">
        <div class="col-md-4"><div class="card shadow-sm p-3 text-center border-warning"><h6 class="text-muted">Students with Dues</h6><h3 class="text-warning">${students.length}</h3></div></div>
        <div class="col-md-4"><div class="card shadow-sm p-3 text-center border-danger"><h6 class="text-muted">Total Outstanding</h6><h3 class="text-danger">Rs. ${totalOutstanding.toLocaleString()}</h3></div></div>
      </div>
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>#</th><th>Student</th><th>Fee</th><th>Paid</th><th>Outstanding</th><th>Action</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" class="text-center text-muted">All fees are up to date!</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

async function sendWhatsAppReminder(studentId, studentName, className, outstanding, phone) {
  if (!phone) return showToast('No phone number available', 'warning');
  let cleanPhone = phone.replace(/[\s\-\+]/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.substring(1);

  const message = `*Fee Payment Reminder*\n\nDear Parent/Guardian,\n\nThis is a gentle reminder regarding the pending school fees for your ward.\n\n*Student Details:*\n• Name: ${studentName}\n• Class: ${className}\n\n*Fee Details:*\n• Outstanding Amount: *Rs. ${outstanding.toLocaleString()}*\n\nKindly clear the outstanding amount at your earliest convenience.\n\nThank you.\nSchool Administration`;

  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  showToast('WhatsApp reminder opened!', 'success');
}

window.loadFeeReminders = loadFeeReminders;
window.sendWhatsAppReminder = sendWhatsAppReminder;