// ==========================================
// STUDENTS MANAGEMENT
// ==========================================
async function loadStudents() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Students Management';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/students');
    const students = res.data;

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
              <small class="text-muted">${s.grNo || 'N/A'}</small>
            </div>
          </div>
        </td>
        <td>${s.fatherName}</td>
        <td>${s.class} ${s.section || ''}</td>
        <td>${s.phone || 'N/A'}</td>
        <td><span class="badge bg-${s.status === 'Active' ? 'success' : 'secondary'}">${s.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editStudent('${s._id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent('${s._id}', '${s.fullName}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');

    main.innerHTML = `
      <button class="btn btn-primary mb-3" onclick="showStudentModal()"><i class="bi bi-plus-circle"></i> Add Student</button>
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Name</th><th>Father</th><th>Class</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" class="text-center text-muted">No students found</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

async function editStudent(id) {
  try {
    const res = await api.get(`/students/${id}`);
    showStudentModal(res.data);
  } catch (err) { showToast(err.message, 'danger'); }
}

function showStudentModal(student = null) {
  const isEdit = !!student;
  const html = `
    <div class="modal fade show" id="studentModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">${isEdit ? 'Edit' : 'Add'} Student</h5><button type="button" class="btn-close" onclick="closeModal('studentModal')"></button></div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6"><label class="form-label">Full Name *</label><input type="text" id="sName" class="form-control" value="${student?.fullName || ''}"></div>
              <div class="col-md-6"><label class="form-label">Father Name *</label><input type="text" id="sFather" class="form-control" value="${student?.fatherName || ''}"></div>
              <div class="col-md-4"><label class="form-label">GR No</label><input type="text" id="sGR" class="form-control" value="${student?.grNo || ''}"></div>
              <div class="col-md-4"><label class="form-label">Class *</label><input type="text" id="sClass" class="form-control" value="${student?.class || ''}"></div>
              <div class="col-md-4"><label class="form-label">Section</label><input type="text" id="sSection" class="form-control" value="${student?.section || 'A'}"></div>
              <div class="col-md-6"><label class="form-label">Phone</label><input type="text" id="sPhone" class="form-control" value="${student?.phone || ''}"></div>
              <div class="col-md-6"><label class="form-label">Fee Amount</label><input type="number" id="sFee" class="form-control" value="${student?.fee || 0}"></div>
              
              <!-- Student Photo URL Field -->
              <div class="col-12">
                <label class="form-label">Student Photo URL <small class="text-muted">(Optional - Direct image link)</small></label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-image"></i></span>
                  <input type="url" id="sImageURL" class="form-control" 
                         value="${student?.imageURL || ''}" 
                         placeholder="https://example.com/photo.jpg" 
                         oninput="previewStudentImage(this.value)">
                  <button class="btn btn-outline-secondary" type="button" onclick="clearStudentImage()">
                    <i class="bi bi-x-circle"></i> Clear
                  </button>
                </div>
                <small class="text-muted">
                  <i class="bi bi-info-circle"></i> 
                  Paste any direct image URL (e.g., from Google Drive, Imgur, or your server). 
                  This photo will automatically appear on the Student ID Card.
                </small>
                
                <!-- Image Preview -->
                <div id="sImagePreviewContainer" class="mt-2" style="${student?.imageURL ? '' : 'display:none;'}">
                  <div class="card border p-2" style="width: 150px;">
                    <img id="sImagePreview" src="${student?.imageURL || ''}" 
                         alt="Preview" 
                         style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px;"
                         onerror="this.parentElement.style.display='none'; showToast('Invalid image URL', 'warning');">
                    <small class="text-center text-muted mt-1 d-block">Preview</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('studentModal')">Cancel</button>
            <button class="btn btn-primary" onclick="saveStudent('${student?._id || ''}')">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').innerHTML = html;
}

function previewStudentImage(url) {
  const container = document.getElementById('sImagePreviewContainer');
  const preview = document.getElementById('sImagePreview');
  
  if (!url || url.trim() === '') {
    container.style.display = 'none';
    return;
  }
  
  preview.src = url;
  container.style.display = 'block';
  
  preview.onerror = () => {
    container.style.display = 'none';
    showToast('Invalid image URL. Please check the link.', 'warning');
  };
}

function clearStudentImage() {
  document.getElementById('sImageURL').value = '';
  document.getElementById('sImagePreviewContainer').style.display = 'none';
}

async function saveStudent(id) {
  const data = {
    fullName: document.getElementById('sName').value,
    fatherName: document.getElementById('sFather').value,
    grNo: document.getElementById('sGR').value,
    class: document.getElementById('sClass').value,
    section: document.getElementById('sSection').value,
    phone: document.getElementById('sPhone').value,
    fee: parseFloat(document.getElementById('sFee').value) || 0,
    imageURL: document.getElementById('sImageURL').value.trim() || ''
  };

  if (!data.fullName || !data.fatherName || !data.class) return showToast('Please fill required fields', 'warning');

  try {
    if (id) await api.put(`/students/${id}`, data);
    else await api.post('/students', data);
    showToast('Student saved!', 'success');
    closeModal('studentModal');
    loadStudents();
  } catch (err) { showToast(err.message, 'danger'); }
}

async function deleteStudent(id, name) {
  if (!confirm(`Delete student "${name}"?`)) return;
  try {
    await api.delete(`/students/${id}`);
    showToast('Student deleted', 'success');
    loadStudents();
  } catch (err) { showToast(err.message, 'danger'); }
}

// ==========================================
// TEACHERS MANAGEMENT
// ==========================================
async function loadTeachers() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Teachers Management';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/teachers');
    const teachers = res.data;

    let rows = teachers.map(t => `
      <tr>
        <td><strong>${t.fullName}</strong><br><small class="text-muted">${t.empCode || 'N/A'}</small></td>
        <td>${t.subjects ? t.subjects.join(', ') : 'N/A'}</td>
        <td>Rs. ${t.monthlyPackage?.toLocaleString() || 0}</td>
        <td>${t.phone || 'N/A'}</td>
        <td><span class="badge bg-${t.status === 'Active' ? 'success' : 'secondary'}">${t.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editTeacher('${t._id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteTeacher('${t._id}', '${t.fullName}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');

    main.innerHTML = `
      <button class="btn btn-primary mb-3" onclick="showTeacherModal()"><i class="bi bi-plus-circle"></i> Add Teacher</button>
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Name</th><th>Subjects</th><th>Package</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" class="text-center text-muted">No teachers found</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

async function editTeacher(id) {
  try {
    const res = await api.get(`/teachers/${id}`);
    showTeacherModal(res.data);
  } catch (err) { showToast(err.message, 'danger'); }
}

function showTeacherModal(teacher = null) {
  const isEdit = !!teacher;
  const html = `
    <div class="modal fade show" id="teacherModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">${isEdit ? 'Edit' : 'Add'} Teacher</h5><button type="button" class="btn-close" onclick="closeModal('teacherModal')"></button></div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6"><label class="form-label">Full Name *</label><input type="text" id="tName" class="form-control" value="${teacher?.fullName || ''}"></div>
              <div class="col-md-6"><label class="form-label">Emp Code</label><input type="text" id="tCode" class="form-control" value="${teacher?.empCode || ''}"></div>
              <div class="col-md-6"><label class="form-label">Subjects (comma separated)</label><input type="text" id="tSubjects" class="form-control" value="${teacher?.subjects ? teacher.subjects.join(', ') : ''}"></div>
              <div class="col-md-6"><label class="form-label">Monthly Package</label><input type="number" id="tPackage" class="form-control" value="${teacher?.monthlyPackage || 0}"></div>
              <div class="col-md-6"><label class="form-label">Phone</label><input type="text" id="tPhone" class="form-control" value="${teacher?.phone || ''}"></div>
              <div class="col-md-6"><label class="form-label">Email</label><input type="email" id="tEmail" class="form-control" value="${teacher?.email || ''}"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('teacherModal')">Cancel</button>
            <button class="btn btn-primary" onclick="saveTeacher('${teacher?._id || ''}')">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').innerHTML = html;
}

async function saveTeacher(id) {
  const subjectsStr = document.getElementById('tSubjects').value;
  const subjectsArray = subjectsStr ? subjectsStr.split(',').map(s => s.trim()) : [];

  const data = {
    fullName: document.getElementById('tName').value,
    empCode: document.getElementById('tCode').value,
    subjects: subjectsArray,
    monthlyPackage: parseFloat(document.getElementById('tPackage').value) || 0,
    phone: document.getElementById('tPhone').value,
    email: document.getElementById('tEmail').value
  };

  if (!data.fullName) return showToast('Full name is required', 'warning');

  try {
    if (id) await api.put(`/teachers/${id}`, data);
    else await api.post('/teachers', data);
    showToast('Teacher saved!', 'success');
    closeModal('teacherModal');
    loadTeachers();
  } catch (err) { showToast(err.message, 'danger'); }
}

async function deleteTeacher(id, name) {
  if (!confirm(`Delete teacher "${name}"?`)) return;
  try {
    await api.delete(`/teachers/${id}`);
    showToast('Teacher deleted', 'success');
    loadTeachers();
  } catch (err) { showToast(err.message, 'danger'); }
}

// ==========================================
// CLASSES MANAGEMENT (With Student Count)
// ==========================================
async function loadClasses() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Classes Management';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/classes');
    const classes = res.data;

    // ✅ NEW: Display classes with student count
    let cards = classes.map(c => `
      <div class="col-md-4 mb-3">
        <div class="card shadow-sm h-100">
          <div class="card-body text-center">
            <div class="mb-3">
              <i class="bi bi-building text-primary" style="font-size: 2.5rem;"></i>
            </div>
            <h4 class="mb-2">${c.className}</h4>
            <p class="text-muted mb-3">Section: ${c.section}</p>
            
            <!-- ✅ NEW: Student Count Badge -->
            <div class="mb-3">
              <span class="badge bg-${c.studentCount > 0 ? 'success' : 'secondary'} fs-6 px-3 py-2">
                <i class="bi bi-people-fill"></i> ${c.studentCount || 0} Students
              </span>
            </div>
            
            <button class="btn btn-sm btn-outline-danger" onclick="deleteClass('${c._id}', '${c.className}')">
              <i class="bi bi-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // ✅ NEW: Total students summary
    const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
    
    main.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <button class="btn btn-primary" onclick="showClassModal()"><i class="bi bi-plus-circle"></i> Add Class</button>
        <div class="alert alert-info mb-0 py-2 px-3">
          <i class="bi bi-mortarboard"></i> <strong>Total Students:</strong> ${totalStudents}
        </div>
      </div>
      <div class="row">${cards || '<div class="col-12 text-center text-muted">No classes found</div>'}</div>
    `;
  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function showClassModal() {
  const html = `
    <div class="modal fade show" id="classModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Add Class</h5><button type="button" class="btn-close" onclick="closeModal('classModal')"></button></div>
          <div class="modal-body">
            <div class="mb-3"><label class="form-label">Class Name *</label><input type="text" id="cName" class="form-control" placeholder="e.g. Class 1"></div>
            <div class="mb-3"><label class="form-label">Section</label><input type="text" id="cSection" class="form-control" value="A"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('classModal')">Cancel</button>
            <button class="btn btn-primary" onclick="saveClass()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').innerHTML = html;
}

async function saveClass() {
  const data = {
    className: document.getElementById('cName').value,
    section: document.getElementById('cSection').value
  };
  if (!data.className) return showToast('Class name is required', 'warning');

  try {
    await api.post('/classes', data);
    showToast('Class added!', 'success');
    closeModal('classModal');
    loadClasses();
  } catch (err) { showToast(err.message, 'danger'); }
}

async function deleteClass(id, name) {
  if (!confirm(`Delete class "${name}"?`)) return;
  try {
    await api.delete(`/classes/${id}`);
    showToast('Class deleted', 'success');
    loadClasses();
  } catch (err) { showToast(err.message, 'danger'); }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Global Exports
window.loadStudents = loadStudents;
window.editStudent = editStudent;
window.showStudentModal = showStudentModal;
window.saveStudent = saveStudent;
window.deleteStudent = deleteStudent;
window.previewStudentImage = previewStudentImage;
window.clearStudentImage = clearStudentImage;
window.loadTeachers = loadTeachers;
window.editTeacher = editTeacher;
window.showTeacherModal = showTeacherModal;
window.saveTeacher = saveTeacher;
window.deleteTeacher = deleteTeacher;
window.loadClasses = loadClasses;
window.showClassModal = showClassModal;
window.saveClass = saveClass;
window.deleteClass = deleteClass;
window.closeModal = closeModal;