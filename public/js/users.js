async function loadUsers() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'User Management';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/users');
    const users = res.data;

    let rows = users.map(u => `
      <tr>
        <td><strong>${u.fullName}</strong><br><small class="text-muted">@${u.username}</small></td>
        <td>${u.email || 'N/A'}</td>
        <td><span class="badge bg-${u.role === 'Admin' ? 'danger' : 'primary'}">${u.role}</span></td>
        <td><span class="badge bg-${u.status === 'Active' ? 'success' : 'secondary'}">${u.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser('${u._id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${u._id}', '${u.username}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');

    main.innerHTML = `
      <button class="btn btn-primary mb-3" onclick="showUserModal()"><i class="bi bi-plus-circle"></i> Add User</button>
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">No users found</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

async function editUser(id) {
  try {
    const res = await api.get('/users'); // Fetching all to find by ID (Optimization: add GET /:id later)
    const user = res.data.find(u => u._id === id);
    if (user) showUserModal(user);
  } catch (err) { showToast(err.message, 'danger'); }
}

function showUserModal(user = null) {
  const isEdit = !!user;
  const html = `
    <div class="modal fade show" id="userModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">${isEdit ? 'Edit' : 'Add'} User</h5><button type="button" class="btn-close" onclick="closeModal('userModal')"></button></div>
          <div class="modal-body">
            <div class="mb-3"><label class="form-label">Full Name *</label><input type="text" id="uName" class="form-control" value="${user?.fullName || ''}"></div>
            <div class="mb-3"><label class="form-label">Username *</label><input type="text" id="uUsername" class="form-control" value="${user?.username || ''}" ${isEdit ? 'readonly' : ''}></div>
            <div class="mb-3"><label class="form-label">Email</label><input type="email" id="uEmail" class="form-control" value="${user?.email || ''}"></div>
            <div class="mb-3"><label class="form-label">Role *</label>
              <select id="uRole" class="form-select">
                <option value="Admin" ${user?.role === 'Admin' ? 'selected' : ''}>Admin</option>
                <option value="Accountant" ${user?.role === 'Accountant' ? 'selected' : ''}>Accountant</option>
                <option value="Clerk" ${user?.role === 'Clerk' ? 'selected' : ''}>Clerk</option>
              </select>
            </div>
            <div class="mb-3"><label class="form-label">Password ${isEdit ? '(Leave blank to keep)' : '*'}</label><input type="password" id="uPass" class="form-control"></div>
            ${isEdit ? `<div class="mb-3"><label class="form-label">Status</label>
              <select id="uStatus" class="form-select">
                <option value="Active" ${user?.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Inactive" ${user?.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
              </select></div>` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('userModal')">Cancel</button>
            <button class="btn btn-primary" onclick="saveUser('${user?._id || ''}')">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').innerHTML = html;
}

async function saveUser(id) {
  const data = {
    fullName: document.getElementById('uName').value,
    username: document.getElementById('uUsername').value,
    email: document.getElementById('uEmail').value,
    role: document.getElementById('uRole').value,
    password: document.getElementById('uPass').value
  };

  if (id) {
    data.status = document.getElementById('uStatus').value;
    if (!data.password) delete data.password;
  } else {
    if (!data.password) return showToast('Password is required', 'warning');
  }

  try {
    if (id) await api.put(`/users/${id}`, data);
    else await api.post('/users', data);
    
    showToast('User saved successfully!', 'success');
    closeModal('userModal');
    loadUsers();
  } catch (err) { showToast(err.message, 'danger'); }
}

async function deleteUser(id, username) {
  if (!confirm(`Delete user "${username}"?`)) return;
  try {
    await api.delete(`/users/${id}`);
    showToast('User deleted', 'success');
    loadUsers();
  } catch (err) { showToast(err.message, 'danger'); }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

window.loadUsers = loadUsers;
window.editUser = editUser;
window.showUserModal = showUserModal;
window.saveUser = saveUser;
window.deleteUser = deleteUser;
window.closeModal = closeModal;