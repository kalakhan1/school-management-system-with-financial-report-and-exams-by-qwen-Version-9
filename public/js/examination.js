// ==========================================
// EXAMS MANAGEMENT
// ==========================================
async function loadExams() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Exams Management';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/exams');
    const exams = res.data || [];

    let rows = exams.map(e => `
      <tr>
        <td><strong>${e.examType}</strong></td>
        <td>${e.examYear}</td>
        <td>${e.startDate ? new Date(e.startDate).toLocaleDateString() : 'N/A'}</td>
        <td>${e.endDate ? new Date(e.endDate).toLocaleDateString() : 'N/A'}</td>
        <td><span class="badge bg-${e.status === 'Active' ? 'success' : 'secondary'}">${e.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-success me-1" onclick="showRegisteredStudentsModal('${e.examType}', '${e.examYear}')" title="View Students"><i class="bi bi-people-fill"></i></button>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="showExamRegistrationModal('${e.examType}', '${e.examYear}')" title="Register"><i class="bi bi-person-plus"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteExam('${e._id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');

    main.innerHTML = `
      <button class="btn btn-primary mb-3" onclick="showAddExamModal()"><i class="bi bi-plus-circle"></i> Add Exam</button>
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Type</th><th>Year</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" class="text-center text-muted">No exams found</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

function showAddExamModal() {
  const html = `
    <div class="modal fade show" id="addExamModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Add Exam</h5><button type="button" class="btn-close" onclick="closeModal('addExamModal')"></button></div>
          <div class="modal-body">
            <div class="mb-3"><label class="form-label">Exam Type *</label>
              <select id="examType" class="form-select">
                <option value="Mid-Term">Mid-Term</option><option value="Annual">Annual</option>
                <option value="Term">Term</option><option value="Supplementary">Supplementary</option>
              </select>
            </div>
            <div class="mb-3"><label class="form-label">Year *</label><input type="number" id="examYear" class="form-control" value="${new Date().getFullYear()}"></div>
            <div class="row g-2">
              <div class="col-md-6"><label class="form-label">Start Date</label><input type="date" id="examStart" class="form-control"></div>
              <div class="col-md-6"><label class="form-label">End Date</label><input type="date" id="examEnd" class="form-control"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('addExamModal')">Cancel</button>
            <button class="btn btn-primary" onclick="saveExam()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').innerHTML = html;
}

async function saveExam() {
  const data = {
    examType: document.getElementById('examType').value,
    examYear: parseInt(document.getElementById('examYear').value),
    startDate: document.getElementById('examStart').value,
    endDate: document.getElementById('examEnd').value
  };
  try {
    await api.post('/exams', data);
    showToast('Exam added!', 'success');
    closeModal('addExamModal');
    loadExams();
  } catch (err) { showToast(err.message, 'danger'); }
}

async function deleteExam(id) {
  if (!confirm('Delete this exam?')) return;
  try { await api.delete(`/exams/${id}`); showToast('Exam deleted', 'success'); loadExams(); } 
  catch (err) { showToast(err.message, 'danger'); }
}

// ==========================================
// EXAM REGISTRATION (Smart Search & Subjects)
// ==========================================
async function showExamRegistrationModal(examType, examYear) {
  window.currentSelectedSubjects = [];
  const html = `
    <div class="modal fade show" id="examRegModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Register: ${examType} ${examYear}</h5><button type="button" class="btn-close" onclick="closeModal('examRegModal')"></button></div>
          <div class="modal-body">
            <input type="hidden" id="erExamType" value="${examType}">
            <input type="hidden" id="erExamYear" value="${examYear}">
            
            <div class="mb-3 position-relative">
              <label class="form-label fw-bold">Search Student *</label>
              <input type="text" id="erStudentSearch" class="form-control" placeholder="Type name (min 2 chars)..." oninput="searchExamStudents(this.value)" autocomplete="off">
              <input type="hidden" id="erStudentId">
              <div id="erStudentSuggestions" class="list-group position-absolute w-100 shadow-sm" style="z-index: 1050; max-height: 200px; overflow-y: auto; display: none; background: white;"></div>
            </div>

            <div class="mb-3"><label class="form-label">Roll Number *</label><input type="text" id="erRollNo" class="form-control" required></div>
            
            <div class="mb-3">
              <label class="form-label">Select Subject</label>
              <select id="erSubjectSelect" class="form-select" onchange="handleSubjectDropdownChange()">
                <option value="">-- Select Subject --</option>
                <option value="Math">Math</option><option value="Science">Science</option>
                <option value="English">English</option><option value="Urdu">Urdu</option>
                <option value="Islamiat">Islamiat</option><option value="Social Studies">Social Studies</option>
                <option value="Computer">Computer</option><option value="General Knowledge">General Knowledge</option>
                <option value="Custom">+ Add Custom Subject</option>
              </select>
              <input type="text" id="erCustomSubject" class="form-control mt-2" style="display:none;" placeholder="Enter custom subject name">
              <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addSubjectToRegistration()">Add Subject</button>
              <div id="erSelectedSubjects" class="mt-2"></div>
            </div>

            <div class="mb-3"><label class="form-label">Fee Status</label>
              <select id="erFeeStatus" class="form-select">
                <option value="Pending">Pending</option><option value="Cleared">Cleared</option><option value="Special Permission">Special Permission</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('examRegModal')">Cancel</button>
            <button class="btn btn-primary" onclick="saveExamRegistration()">Register</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').innerHTML = html;
}

function handleSubjectDropdownChange() {
  document.getElementById('erCustomSubject').style.display = document.getElementById('erSubjectSelect').value === 'Custom' ? 'block' : 'none';
}

function addSubjectToRegistration() {
  const select = document.getElementById('erSubjectSelect');
  const customInput = document.getElementById('erCustomSubject');
  let subject = select.value === 'Custom' ? customInput.value.trim() : select.value;
  
  if (!subject || subject === '') return showToast('Please select or enter a subject', 'warning');
  if (!window.currentSelectedSubjects.includes(subject)) {
    window.currentSelectedSubjects.push(subject);
    renderSelectedSubjects();
  }
  select.value = ''; customInput.value = ''; customInput.style.display = 'none';
}

function renderSelectedSubjects() {
  document.getElementById('erSelectedSubjects').innerHTML = window.currentSelectedSubjects.map(s => 
    `<span class="badge bg-primary me-1 p-2">${s} <i class="bi bi-x-circle ms-1" style="cursor:pointer;" onclick="removeSubject('${s}')"></i></span>`
  ).join('');
}

function removeSubject(subject) {
  window.currentSelectedSubjects = window.currentSelectedSubjects.filter(s => s !== subject);
  renderSelectedSubjects();
}

let examStudentSearchTimer;
function searchExamStudents(query) {
  const dropdown = document.getElementById('erStudentSuggestions');
  const hiddenId = document.getElementById('erStudentId');
  if (hiddenId) hiddenId.value = '';
  if (!query || query.length < 2) { if (dropdown) dropdown.style.display = 'none'; return; }

  clearTimeout(examStudentSearchTimer);
  examStudentSearchTimer = setTimeout(async () => {
    try {
      const res = await api.get(`/students?search=${encodeURIComponent(query)}&limit=10`);
      const students = res.data || [];
      dropdown.innerHTML = students.length === 0 ? '<div class="list-group-item text-muted small">No students found</div>' : 
        students.map(s => `<button type="button" class="list-group-item list-group-item-action small" onclick="selectExamStudent('${s._id}', '${s.fullName.replace(/'/g, "\\'")}', '${s.rollNo || ''}')"><strong>${s.fullName}</strong> <span class="text-muted">(${s.class || 'N/A'})</span></button>`).join('');
      dropdown.style.display = 'block';
    } catch (err) { if (dropdown) dropdown.style.display = 'none'; }
  }, 300);
}

function selectExamStudent(id, name, rollNo) {
  document.getElementById('erStudentId').value = id;
  document.getElementById('erStudentSearch').value = name;
  document.getElementById('erStudentSuggestions').style.display = 'none';
  if (rollNo && !document.getElementById('erRollNo').value) document.getElementById('erRollNo').value = rollNo;
}

document.addEventListener('click', function(e) {
  const searchInput = document.getElementById('erStudentSearch');
  const dropdown = document.getElementById('erStudentSuggestions');
  if (searchInput && dropdown && !searchInput.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none';
});

async function saveExamRegistration() {
  const studentId = document.getElementById('erStudentId').value;
  if (!studentId) return showToast('Please select a student', 'warning');
  if (window.currentSelectedSubjects.length === 0) return showToast('Please add at least one subject', 'warning');

  const data = {
    examType: document.getElementById('erExamType').value,
    examYear: parseInt(document.getElementById('erExamYear').value),
    student: studentId,
    rollNumber: document.getElementById('erRollNo').value,
    subjects: window.currentSelectedSubjects,
    feeStatus: document.getElementById('erFeeStatus').value
  };

  try {
    await api.post('/exams/registrations', data);
    showToast('Student registered!', 'success');
    closeModal('examRegModal');
  } catch (err) { showToast(err.message, 'danger'); }
}

// ==========================================
// VIEW REGISTERED STUDENTS (Search, Update, Delete)
// ==========================================
async function showRegisteredStudentsModal(examType, examYear) {
  const html = `
    <div class="modal fade show" id="viewRegModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Registered: ${examType} ${examYear}</h5><button type="button" class="btn-close" onclick="closeModal('viewRegModal')"></button></div>
          <div class="modal-body">
            <input type="text" id="regSearchInput" class="form-control mb-3" placeholder="Search by student name..." oninput="debounceRegSearch('${examType}', '${examYear}', this.value)">
            <div id="regTableContainer" class="table-responsive"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').innerHTML = html;
  loadRegisteredStudents(examType, examYear);
}

let regSearchTimer;
function debounceRegSearch(examType, examYear, query) {
  clearTimeout(regSearchTimer);
  regSearchTimer = setTimeout(() => loadRegisteredStudents(examType, examYear, query), 400);
}

async function loadRegisteredStudents(examType, examYear, search = '') {
  const container = document.getElementById('regTableContainer');
  container.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm"></div></div>';
  try {
    const res = await api.get(`/exams/registrations?examType=${examType}&examYear=${examYear}&search=${encodeURIComponent(search)}`);
    const regs = res.data || [];
    let rows = regs.map(r => `
      <tr>
        <td><strong>${r.student?.fullName || 'Unknown'}</strong><br><small>${r.student?.class || ''}</small></td>
        <td>${r.rollNumber || 'N/A'}</td>
        <td>${r.subjects ? r.subjects.join(', ') : 'N/A'}</td>
        <td><span class="badge bg-${r.feeStatus === 'Cleared' ? 'success' : 'warning'}">${r.feeStatus}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editRegistration('${r._id}', '${r.rollNumber}', '${r.subjects.join(',')}', '${r.feeStatus}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteRegistration('${r._id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
    container.innerHTML = `<table class="table table-hover table-sm mb-0"><thead class="table-light"><tr><th>Student</th><th>Roll No</th><th>Subjects</th><th>Fee Status</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">No students registered</td></tr>'}</tbody></table>`;
  } catch (err) { container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

function editRegistration(id, rollNo, subjects, feeStatus) {
  const newRollNo = prompt('Update Roll Number:', rollNo);
  if (newRollNo === null) return;
  const newFeeStatus = prompt('Update Fee Status (Cleared/Pending/Special Permission):', feeStatus);
  if (newFeeStatus === null) return;

  api.put(`/exams/registrations/${id}`, { rollNumber: newRollNo, feeStatus: newFeeStatus, subjects: subjects.split(',') })
    .then(() => { showToast('Updated!', 'success'); location.reload(); })
    .catch(err => showToast(err.message, 'danger'));
}

async function deleteRegistration(id) {
  if (!confirm('Move this registration to Trash?')) return;
  try {
    await api.delete(`/exams/registrations/${id}`);
    showToast('Moved to trash!', 'success');
    location.reload();
  } catch (err) { showToast(err.message, 'danger'); }
}

// ==========================================
// RESULTS MANAGEMENT & CREATION FORM
// ==========================================
async function loadResults() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Results Management';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/results');
    const results = res.data || [];

    let rows = results.map(r => `
      <tr>
        <td><strong>${r.student?.fullName || 'Unknown'}</strong><br><small class="text-muted">${r.student?.class || ''}</small></td>
        <td>${r.registration?.examType || 'N/A'} ${r.registration?.examYear || ''}</td>
        <td><strong>${r.percentage || 0}%</strong></td>
        <td><span class="badge bg-${r.grade?.startsWith('A') ? 'success' : r.grade?.startsWith('B') ? 'primary' : 'info'}">${r.grade || 'N/A'}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="printResultCard('${r._id}')"><i class="bi bi-printer"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteResultCard('${r._id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');

    main.innerHTML = `
      <button class="btn btn-primary mb-3" onclick="showCreateResultModal()"><i class="bi bi-plus-circle"></i> Create Result Card</button>
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Student</th><th>Exam</th><th>Percentage</th><th>Grade</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">No results found</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

async function showCreateResultModal() {
  const html = `
    <div class="modal fade show" id="createResultModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Create Result Card</h5><button type="button" class="btn-close" onclick="closeModal('createResultModal')"></button></div>
          <div class="modal-body">
            <div class="row g-3 mb-4">
              <div class="col-md-6 position-relative">
                <label class="form-label">Search Student *</label>
                <input type="text" id="crStudentSearch" class="form-control" placeholder="Type name..." oninput="searchResultStudents(this.value)" autocomplete="off">
                <input type="hidden" id="crStudentId">
                <div id="crStudentSuggestions" class="list-group position-absolute w-100 shadow-sm" style="z-index: 1050; max-height: 150px; overflow-y: auto; display: none; background: white;"></div>
              </div>
              <div class="col-md-3">
                <label class="form-label">Exam Type *</label>
                <select id="crExamType" class="form-select">
                  <option value="Annual">Annual</option><option value="Mid-Term">Mid-Term</option>
                  <option value="Term">Term</option><option value="Supplementary">Supplementary</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Year *</label>
                <input type="number" id="crExamYear" class="form-control" value="${new Date().getFullYear()}">
              </div>
            </div>
            <button type="button" class="btn btn-success w-100 mb-3" onclick="loadSubjectsForResult()"><i class="bi bi-search"></i> Load Subjects & Generate Form</button>
            <div id="resultSubjectsForm"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('createResultModal')">Cancel</button>
            <button class="btn btn-primary" onclick="saveResultCard()">Save Result Card</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').innerHTML = html;
}

let resultStudentSearchTimer;
function searchResultStudents(query) {
  const dropdown = document.getElementById('crStudentSuggestions');
  const hiddenId = document.getElementById('crStudentId');
  if (hiddenId) hiddenId.value = '';
  if (!query || query.length < 2) { if (dropdown) dropdown.style.display = 'none'; return; }

  clearTimeout(resultStudentSearchTimer);
  resultStudentSearchTimer = setTimeout(async () => {
    try {
      const res = await api.get(`/students?search=${encodeURIComponent(query)}&limit=10`);
      const students = res.data || [];
      dropdown.innerHTML = students.map(s => `<button type="button" class="list-group-item list-group-item-action small" onclick="selectResultStudent('${s._id}', '${s.fullName.replace(/'/g, "\\'")}')"><strong>${s.fullName}</strong> <span class="text-muted">(${s.class || 'N/A'})</span></button>`).join('');
      dropdown.style.display = 'block';
    } catch (err) { if (dropdown) dropdown.style.display = 'none'; }
  }, 300);
}

function selectResultStudent(id, name) {
  document.getElementById('crStudentId').value = id;
  document.getElementById('crStudentSearch').value = name;
  document.getElementById('crStudentSuggestions').style.display = 'none';
}

async function loadSubjectsForResult() {
  const studentId = document.getElementById('crStudentId').value;
  const examType = document.getElementById('crExamType').value;
  const examYear = document.getElementById('crExamYear').value;
  const container = document.getElementById('resultSubjectsForm');

  if (!studentId) return showToast('Please select a student first', 'warning');
  container.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm"></div> Loading subjects...</div>';

  try {
    const res = await api.get(`/exams/registrations?examType=${examType}&examYear=${examYear}`);
    const regs = res.data || [];
    const registration = regs.find(r => r.student._id === studentId);
    
    if (!registration) { container.innerHTML = '<div class="alert alert-warning">No exam registration found for this student and exam.</div>'; return; }
    const subjects = registration.subjects || [];
    if (subjects.length === 0) { container.innerHTML = '<div class="alert alert-warning">No subjects found in registration.</div>'; return; }

    let rows = subjects.map((sub, index) => `
      <tr>
        <td><strong>${sub}</strong></td>
        <td><input type="number" class="form-control form-control-sm sub-obtained" data-index="${index}" value="0" min="0" oninput="calculateResultTotals()"></td>
        <td><input type="number" class="form-control form-control-sm sub-total" data-index="${index}" value="100" min="1" oninput="calculateResultTotals()"></td>
      </tr>
    `).join('');

    container.innerHTML = `
      <input type="hidden" id="crRegistrationId" value="${registration._id}">
      <table class="table table-bordered table-sm">
        <thead class="table-light"><tr><th>Subject</th><th>Obtained Marks</th><th>Total Marks</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot class="table-secondary">
          <tr><td><strong>Total</strong></td><td><strong id="crTotalObtained">0</strong></td><td><strong id="crTotalMax">0</strong></td></tr>
          <tr><td><strong>Percentage</strong></td><td colspan="2"><strong id="crPercentage" class="text-primary fs-5">0%</strong></td></tr>
          <tr><td><strong>Grade</strong></td><td colspan="2"><strong id="crGrade" class="fs-5">-</strong></td></tr>
        </tfoot>
      </table>
    `;
  } catch (err) { container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

function calculateResultTotals() {
  const obtainedInputs = document.querySelectorAll('.sub-obtained');
  const totalInputs = document.querySelectorAll('.sub-total');
  let totalObtained = 0, totalMax = 0;
  
  obtainedInputs.forEach((input, i) => {
    totalObtained += parseFloat(input.value) || 0;
    totalMax += parseFloat(totalInputs[i].value) || 0;
  });

  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';
  else if (percentage >= 40) grade = 'E';

  document.getElementById('crTotalObtained').textContent = totalObtained;
  document.getElementById('crTotalMax').textContent = totalMax;
  document.getElementById('crPercentage').textContent = percentage.toFixed(2) + '%';
  document.getElementById('crGrade').textContent = grade;
}

async function saveResultCard() {
  const registrationId = document.getElementById('crRegistrationId')?.value;
  const studentId = document.getElementById('crStudentId').value;
  if (!registrationId || !studentId) return showToast('Please load subjects first', 'warning');

  const obtainedInputs = document.querySelectorAll('.sub-obtained');
  const totalInputs = document.querySelectorAll('.sub-total');
  const subjects = [];
  let totalObtained = 0, totalMax = 0;
  
  obtainedInputs.forEach((input, i) => {
    const subName = input.closest('tr').querySelector('td strong').textContent;
    const obt = parseFloat(input.value) || 0;
    const tot = parseFloat(totalInputs[i].value) || 0;
    subjects.push({ subject: subName, obtained: obt, total: tot });
    totalObtained += obt; totalMax += tot;
  });

  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  let grade = 'F';
  if (percentage >= 90) grade = 'A+'; else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B'; else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D'; else if (percentage >= 40) grade = 'E';

  const data = {
    registration: registrationId, student: studentId, subjectMarks: subjects,
    totalMarks: totalObtained, percentage: parseFloat(percentage.toFixed(2)), grade
  };

  try {
    await api.post('/results', data);
    showToast('Result Card Created!', 'success');
    closeModal('createResultModal');
    loadResults();
  } catch (err) { showToast(err.message, 'danger'); }
}

async function deleteResultCard(id) {
  if (!confirm('Delete this result card?')) return;
  try { await api.delete(`/results/${id}`); showToast('Result deleted', 'success'); loadResults(); } 
  catch (err) { showToast(err.message, 'danger'); }
}

async function printResultCard(id) {
  try {
    showToast('Fetching result data...', 'info');
    const [resResult, resSettings] = await Promise.all([
      api.get(`/results/${id}`),
      api.get('/settings').catch(() => ({ data: { schoolName: 'School Name' } }))
    ]);
    const result = resResult.data;
    const schoolName = resSettings.data?.schoolName || 'Your School Name';
    
    if (!result) return showToast('Result card not found', 'danger');

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return showToast('Popup blocked! Allow popups to print.', 'warning');

    const totalMax = (result.subjectMarks || []).reduce((sum, sm) => sum + (sm.total || 0), 0);

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Result Card</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>body{padding:30px;font-family:Arial,sans-serif;}.result-card{border:3px double #333;padding:30px;border-radius:10px;background:#fff;}.school-header{text-align:center;border-bottom:2px solid #333;padding-bottom:15px;margin-bottom:25px;}@media print{.no-print{display:none!important;}body{padding:0;background:#fff;}.result-card{border:2px solid #000;box-shadow:none;}}</style>
    </head><body>
      <div class="result-card">
        <div class="school-header"><h2>${schoolName}</h2><p>Official Academic Result Card</p></div>
        <div class="row mb-4">
          <div class="col-6">
            <p><strong>Student:</strong> ${result.student?.fullName || 'N/A'}</p>
            <p><strong>Class:</strong> ${result.student?.class || 'N/A'} ${result.student?.section || ''}</p>
            <p><strong>GR No:</strong> ${result.student?.grNo || 'N/A'}</p>
          </div>
          <div class="col-6 text-end">
            <p><strong>Exam:</strong> ${result.registration?.examType || 'N/A'} ${result.registration?.examYear || ''}</p>
            <p><strong>Roll No:</strong> ${result.registration?.rollNumber || 'N/A'}</p>
          </div>
        </div>
        <table class="table table-bordered text-center mb-4">
          <thead class="table-dark"><tr><th>Subject</th><th>Total</th><th>Obtained</th></tr></thead>
          <tbody>${(result.subjectMarks || []).map(sm => `<tr><td class="text-start fw-bold">${sm.subject}</td><td>${sm.total}</td><td><strong>${sm.obtained}</strong></td></tr>`).join('')}</tbody>
          <tfoot class="table-secondary"><tr><td class="text-start"><strong>Grand Total</strong></td><td><strong>${totalMax}</strong></td><td><strong>${result.totalMarks || 0}</strong></td></tr></tfoot>
        </table>
        <div class="row mt-4 text-center">
          <div class="col-4"><h6 class="text-muted text-uppercase">Percentage</h6><h3 class="text-primary fw-bold">${result.percentage || 0}%</h3></div>
          <div class="col-4"><h6 class="text-muted text-uppercase">Grade</h6><h3 class="text-success fw-bold">${result.grade || 'N/A'}</h3></div>
          <div class="col-4"><h6 class="text-muted text-uppercase">Result</h6><h3 class="${result.percentage >= 40 ? 'text-success' : 'text-danger'} fw-bold">${result.percentage >= 40 ? 'PASS' : 'FAIL'}</h3></div>
        </div>
        <div class="row mt-5 pt-4">
          <div class="col-6 text-center"><p class="mb-0" style="border-top:1px solid #333;display:inline-block;width:200px;padding-top:5px;">Class Teacher</p></div>
          <div class="col-6 text-center"><p class="mb-0" style="border-top:1px solid #333;display:inline-block;width:200px;padding-top:5px;">Principal</p></div>
        </div>
      </div>
      <div class="text-center mt-4 no-print">
        <button class="btn btn-primary btn-lg" onclick="window.print()"><i class="bi bi-printer"></i> Print</button>
        <button class="btn btn-secondary btn-lg ms-2" onclick="window.close()"><i class="bi bi-x-circle"></i> Close</button>
      </div>
    </body></html>`);
    printWindow.document.close();
  } catch (err) { showToast('Failed to print: ' + err.message, 'danger'); }
}

// ==========================================
// TEST RESULTS MANAGEMENT
// ==========================================
async function loadTestResults() {
  const main = document.getElementById('mainContent');
  document.getElementById('pageTitle').innerText = 'Test Results';
  main.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await api.get('/test-results?limit=50');
    const tests = res.data || [];

    let rows = tests.map(t => `
      <tr>
        <td>${new Date(t.testDate).toLocaleDateString()}</td>
        <td><strong>${t.student?.fullName || 'Unknown'}</strong><br><small class="text-muted">${t.student?.class || ''}</small></td>
        <td><span class="badge bg-info">${t.testType}</span></td>
        <td>${t.subject}</td>
        <td><strong>${t.marks}/${t.totalMarks}</strong></td>
        <td><strong>${t.percentage}%</strong></td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteTestResult('${t._id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');

    main.innerHTML = `
      <button class="btn btn-primary mb-3" onclick="showAddTestResultModal()"><i class="bi bi-plus-circle"></i> Add Test Result</button>
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light"><tr><th>Date</th><th>Student</th><th>Type</th><th>Subject</th><th>Marks</th><th>%</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="7" class="text-center text-muted">No test results found</td></tr>'}</tbody>
        </table>
      </div></div>
    `;
  } catch (err) { main.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
}

function showAddTestResultModal() {
  const html = `
    <div class="modal fade show" id="testResultModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Add Test Result</h5><button type="button" class="btn-close" onclick="closeModal('testResultModal')"></button></div>
          <div class="modal-body">
            <div class="mb-3"><label class="form-label">Student *</label><select id="trStudent" class="form-select" required></select></div>
            <div class="mb-3"><label class="form-label">Test Type *</label>
              <select id="trType" class="form-select"><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option></select>
            </div>
            <div class="mb-3"><label class="form-label">Subject *</label><input type="text" id="trSubject" class="form-control" required></div>
            <div class="row g-2">
              <div class="col-md-6"><label class="form-label">Marks *</label><input type="number" id="trMarks" class="form-control" min="0" required></div>
              <div class="col-md-6"><label class="form-label">Total Marks *</label><input type="number" id="trTotal" class="form-control" min="1" value="100" required></div>
            </div>
            <div class="mb-3 mt-3"><label class="form-label">Date *</label><input type="date" id="trDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" required></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('testResultModal')">Cancel</button>
            <button class="btn btn-primary" onclick="saveTestResult()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalContainer').innerHTML = html;
  
  api.get('/students?limit=100').then(res => {
    const select = document.getElementById('trStudent');
    select.innerHTML = '<option value="">Select Student...</option>' + (res.data || []).map(s => `<option value="${s._id}">${s.fullName} (${s.class})</option>`).join('');
  });
}

async function saveTestResult() {
  const data = {
    student: document.getElementById('trStudent').value,
    testType: document.getElementById('trType').value,
    subject: document.getElementById('trSubject').value,
    marks: parseFloat(document.getElementById('trMarks').value),
    totalMarks: parseFloat(document.getElementById('trTotal').value),
    testDate: document.getElementById('trDate').value
  };
  data.percentage = data.totalMarks > 0 ? (data.marks / data.totalMarks) * 100 : 0;

  if (!data.student || !data.subject || !data.marks) return showToast('Fill all required fields', 'warning');

  try {
    await api.post('/test-results', data);
    showToast('Test result added!', 'success');
    closeModal('testResultModal');
    loadTestResults();
  } catch (err) { showToast(err.message, 'danger'); }
}

async function deleteTestResult(id) {
  if (!confirm('Delete this test result?')) return;
  try { await api.delete(`/test-results/${id}`); showToast('Deleted', 'success'); loadTestResults(); } 
  catch (err) { showToast(err.message, 'danger'); }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Global Exports
window.loadExams = loadExams;
window.showAddExamModal = showAddExamModal;
window.saveExam = saveExam;
window.deleteExam = deleteExam;
window.showExamRegistrationModal = showExamRegistrationModal;
window.handleSubjectDropdownChange = handleSubjectDropdownChange;
window.addSubjectToRegistration = addSubjectToRegistration;
window.renderSelectedSubjects = renderSelectedSubjects;
window.removeSubject = removeSubject;
window.searchExamStudents = searchExamStudents;
window.selectExamStudent = selectExamStudent;
window.saveExamRegistration = saveExamRegistration;
window.showRegisteredStudentsModal = showRegisteredStudentsModal;
window.debounceRegSearch = debounceRegSearch;
window.editRegistration = editRegistration;
window.deleteRegistration = deleteRegistration;
window.loadResults = loadResults;
window.showCreateResultModal = showCreateResultModal;
window.searchResultStudents = searchResultStudents;
window.selectResultStudent = selectResultStudent;
window.loadSubjectsForResult = loadSubjectsForResult;
window.calculateResultTotals = calculateResultTotals;
window.saveResultCard = saveResultCard;
window.deleteResultCard = deleteResultCard;
window.printResultCard = printResultCard;
window.loadTestResults = loadTestResults;
window.showAddTestResultModal = showAddTestResultModal;
window.saveTestResult = saveTestResult;
window.deleteTestResult = deleteTestResult;
window.closeModal = closeModal;