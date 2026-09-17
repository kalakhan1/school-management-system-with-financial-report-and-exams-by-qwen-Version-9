// ==========================================
// FEE COLLECTION
// ==========================================
async function loadFees() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Fee Collection';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/fees/status');
    const students = res.data;

    let rows = students.map(s => `
      <tr>
        <td><strong>${s.student.fullName}</strong><br><small class="text-muted">${s.student.class}</small></td>
        <td>Rs. ${s.netFee.toLocaleString()}</td>
        <td>Rs. ${s.totalPaid.toLocaleString()}</td>
        <td><strong class="text-danger">Rs. ${s.outstanding.toLocaleString()}</strong></td>
        <td><button class="btn btn-sm btn-success" onclick="showCollectFeeModal('${s.student._id}', '${s.student.fullName}')"><i class="bi bi-cash"></i> Collect</button></td>
      </tr>
    `).join('');

    main.innerHTML = `
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Student</th><th>Net Fee</th><th>Paid</th><th>Outstanding</th><th>Action</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">No active students</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

function showCollectFeeModal(studentId, studentName) {
  const html = `
    <div class="modal fade show" id="feeModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Collect Fee: ${studentName}</h5><button type="button" class="btn-close" onclick="closeModal('feeModal')"></button></div>
          <div class="modal-body">
            <input type="hidden" id="feeStudentId" value="${studentId}">
            <div class="mb-3"><label class="form-label">Month *</label><input type="text" id="feeMonth" class="form-control" value="${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}"></div>
            <div class="mb-3"><label class="form-label">Amount (Rs.) *</label><input type="number" id="feeAmount" class="form-control"></div>
            <div class="mb-3"><label class="form-label">Method</label>
              <select id="feeMethod" class="form-select">
                <option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer</option><option value="Online">Online</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('feeModal')">Cancel</button>
            <button class="btn btn-success" onclick="submitFeeCollection()">Collect</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').innerHTML = html;
}

async function submitFeeCollection() {
  const data = {
    student: document.getElementById('feeStudentId').value,
    month: document.getElementById('feeMonth').value,
    amount: parseFloat(document.getElementById('feeAmount').value),
    paymentMethod: document.getElementById('feeMethod').value
  };
  if (!data.amount || !data.month) return showToast('Fill all fields', 'warning');

  try {
    await api.post('/fees/collect', data);
    showToast('Fee collected!', 'success');
    closeModal('feeModal');
    loadFees();
  } catch (err) { showToast(err.message, 'danger'); }
}

// ==========================================
// EXPENSE MANAGEMENT
// ==========================================
async function loadExpenses() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Expenses';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/expenses');
    const expenses = res.data;

    let rows = expenses.map(e => `
      <tr>
        <td>${new Date(e.date).toLocaleDateString()}</td>
        <td><span class="badge bg-secondary">${e.category}</span></td>
        <td><strong class="text-danger">Rs. ${e.amount.toLocaleString()}</strong></td>
        <td>${e.description || '-'}</td>
        <td><button class="btn btn-sm btn-outline-danger" onclick="deleteExpense('${e._id}')"><i class="bi bi-trash"></i></button></td>
      </tr>
    `).join('');

    main.innerHTML = `
      <button class="btn btn-primary mb-3" onclick="showExpenseModal()"><i class="bi bi-plus-circle"></i> Add Expense</button>
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th><th>Action</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">No expenses</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

function showExpenseModal() {
  const html = `
    <div class="modal fade show" id="expenseModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Add Expense</h5><button type="button" class="btn-close" onclick="closeModal('expenseModal')"></button></div>
          <div class="modal-body">
            <div class="mb-3"><label class="form-label">Category *</label>
              <select id="expCategory" class="form-select">
                <option value="Utilities">Utilities</option><option value="Maintenance">Maintenance</option>
                <option value="Supplies">Supplies</option><option value="Transport">Transport</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div class="mb-3"><label class="form-label">Amount *</label><input type="number" id="expAmount" class="form-control"></div>
            <div class="mb-3"><label class="form-label">Description</label><textarea id="expDesc" class="form-control"></textarea></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('expenseModal')">Cancel</button>
            <button class="btn btn-primary" onclick="saveExpense()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').innerHTML = html;
}

async function saveExpense() {
  const data = {
    category: document.getElementById('expCategory').value,
    amount: parseFloat(document.getElementById('expAmount').value),
    description: document.getElementById('expDesc').value
  };
  if (!data.amount) return showToast('Amount is required', 'warning');

  try {
    await api.post('/expenses', data);
    showToast('Expense added!', 'success');
    closeModal('expenseModal');
    loadExpenses();
  } catch (err) { showToast(err.message, 'danger'); }
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  try {
    await api.delete(`/expenses/${id}`);
    showToast('Deleted', 'success');
    loadExpenses();
  } catch (err) { showToast(err.message, 'danger'); }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

window.loadFees = loadFees;
window.showCollectFeeModal = showCollectFeeModal;
window.submitFeeCollection = submitFeeCollection;
window.loadExpenses = loadExpenses;
window.showExpenseModal = showExpenseModal;
window.saveExpense = saveExpense;
window.deleteExpense = deleteExpense;
window.closeModal = closeModal;