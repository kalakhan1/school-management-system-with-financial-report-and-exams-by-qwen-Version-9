async function loadSalaries() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Salary Management';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/salaries/history');
    const salaries = res.data;

    let rows = salaries.map(s => `
      <tr>
        <td><strong>${s.teacher.fullName}</strong><br><small class="text-muted">${s.teacher.empCode || 'N/A'}</small></td>
        <td>${s.month}</td>
        <td><strong class="text-success">Rs. ${s.amount.toLocaleString()}</strong></td>
        <td>${s.paymentMethod}</td>
        <td>${new Date(s.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join('');

    main.innerHTML = `
      <button class="btn btn-primary mb-3" onclick="showSalaryModal()"><i class="bi bi-cash-stack"></i> Pay Salary</button>
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Teacher</th><th>Month</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">No salary records</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

async function showSalaryModal() {
  try {
    const res = await api.get('/teachers');
    const teachers = res.data;
    
    const options = teachers.map(t => `<option value="${t._id}" data-package="${t.monthlyPackage}">${t.fullName} (${t.empCode || 'N/A'})</option>`).join('');

    const html = `
      <div class="modal fade show" id="salaryModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header"><h5 class="modal-title">Pay Salary</h5><button type="button" class="btn-close" onclick="closeModal('salaryModal')"></button></div>
            <div class="modal-body">
              <div class="mb-3"><label class="form-label">Teacher *</label>
                <select id="salTeacher" class="form-select" onchange="document.getElementById('salAmount').value = this.options[this.selectedIndex].dataset.package || 0">
                  <option value="">Select Teacher</option>${options}
                </select>
              </div>
              <div class="mb-3"><label class="form-label">Month *</label><input type="text" id="salMonth" class="form-control" value="${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}"></div>
              <div class="mb-3"><label class="form-label">Amount (Rs.) *</label><input type="number" id="salAmount" class="form-control"></div>
              <div class="mb-3"><label class="form-label">Method</label>
                <select id="salMethod" class="form-select">
                  <option value="Bank Transfer">Bank Transfer</option><option value="Cash">Cash</option><option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="closeModal('salaryModal')">Cancel</button>
              <button class="btn btn-success" onclick="submitSalary()">Pay Now</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modalContainer').innerHTML = html;
  } catch (err) { showToast('Failed to load teachers', 'danger'); }
}

async function submitSalary() {
  const data = {
    teacher: document.getElementById('salTeacher').value,
    month: document.getElementById('salMonth').value,
    amount: parseFloat(document.getElementById('salAmount').value),
    paymentMethod: document.getElementById('salMethod').value
  };
  if (!data.teacher || !data.amount) return showToast('Fill all fields', 'warning');

  try {
    await api.post('/salaries/pay', data);
    showToast('Salary paid!', 'success');
    closeModal('salaryModal');
    loadSalaries();
  } catch (err) { showToast(err.message, 'danger'); }
}

window.loadSalaries = loadSalaries;
window.showSalaryModal = showSalaryModal;
window.submitSalary = submitSalary;