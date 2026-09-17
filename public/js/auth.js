let currentUser = null;

document.addEventListener('DOMContentLoaded', initAuth);

async function initAuth() {
  const token = localStorage.getItem('token');
  
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appLayout').style.display = 'none';
  
  if (token) {
    try {
      const res = await api.get('/auth/me');
      currentUser = res.data;
      showApp();
    } catch (err) {
      console.log('Token invalid, showing login');
      showLogin();
    }
  } else {
    showLogin();
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await api.post('/auth/login', {
      username: document.getElementById('loginUsername').value,
      password: document.getElementById('loginPassword').value
    });
    localStorage.setItem('token', res.data.token);
    currentUser = res.data;
    showApp();
  } catch (err) {
    showToast(err.message || 'Login failed', 'danger');
  }
});

function showLogin() {
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('appLayout').style.display = 'none';
  document.getElementById('appLayout').classList.remove('d-flex');
  
  if (typeof ThemeManager !== 'undefined') ThemeManager.updateToggleButton();
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appLayout').style.display = 'flex';
  document.getElementById('appLayout').classList.add('d-flex');
  renderSidebar();
  loadDashboard();
  
  if (typeof ThemeManager !== 'undefined') ThemeManager.updateToggleButton();
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  
  let menu = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">School ERP</h4>
      <button class="theme-toggle-btn" onclick="toggleTheme()" title="Toggle Theme">
        <i class="bi bi-moon-fill"></i>
      </button>
    </div>
    <p class="text-muted small">Welcome, ${currentUser.fullName}</p>
    <hr>`;
  
  menu += `<div class="nav flex-column">
    <a href="#" class="nav-link text-white" onclick="loadDashboard()"><i class="bi bi-speedometer2"></i> Dashboard</a>
    <a href="#" class="nav-link text-white" onclick="loadUsers()"><i class="bi bi-people"></i> Users</a>
    
    <hr class="text-white-50 my-2"><small class="text-white-50 px-2">ACADEMIC</small>
    <a href="#" class="nav-link text-white" onclick="loadStudents()"><i class="bi bi-mortarboard"></i> Students</a>
    <a href="#" class="nav-link text-white" onclick="loadTeachers()"><i class="bi bi-person-video2"></i> Teachers</a>
    <a href="#" class="nav-link text-white" onclick="loadClasses()"><i class="bi bi-building"></i> Classes</a>
    <a href="#" class="nav-link text-white" onclick="loadAttendance()"><i class="bi bi-calendar-check"></i> Attendance</a>
    
    <hr class="text-white-50 my-2"><small class="text-white-50 px-2">FINANCE</small>
    <a href="#" class="nav-link text-white" onclick="loadFees()"><i class="bi bi-cash-coin"></i> Fee Collection</a>
    <a href="#" class="nav-link text-white" onclick="loadExpenses()"><i class="bi bi-receipt"></i> Expenses</a>
    <a href="#" class="nav-link text-white" onclick="loadSalaries()"><i class="bi bi-wallet2"></i> Salaries</a>
    
    <hr class="text-white-50 my-2"><small class="text-white-50 px-2">EXAMINATION</small>
    <a href="#" class="nav-link text-white" onclick="loadExams()"><i class="bi bi-journal-bookmark"></i> Exams</a>
    <a href="#" class="nav-link text-white" onclick="loadResults()"><i class="bi bi-file-earmark-ruled"></i> Results</a>
    <a href="#" class="nav-link text-white" onclick="loadTestResults()"><i class="bi bi-clipboard-check"></i> Test Results</a>
    
    <hr class="text-white-50 my-2"><small class="text-white-50 px-2">REPORTS</small>
    <a href="#" class="nav-link text-white" onclick="loadClassResultReport()"><i class="bi bi-file-earmark-ruled"></i> Class Results</a>
    <a href="#" class="nav-link text-white" onclick="loadFinancialReports()"><i class="bi bi-graph-up"></i> Financial Reports</a>
    <a href="#" class="nav-link text-white" onclick="loadFeeReminders()"><i class="bi bi-bell"></i> Fee Reminders</a>
    <a href="#" class="nav-link text-white" onclick="loadIdCards()"><i class="bi bi-person-badge"></i> ID Cards</a>
    
    <hr class="text-white-50 my-2"><small class="text-white-50 px-2">UTILITIES</small>
    <a href="#" class="nav-link text-white" onclick="loadDataManager()"><i class="bi bi-table"></i> Data Manager</a>
    <a href="#" class="nav-link text-white" onclick="loadArchive()"><i class="bi bi-trash"></i> Trash / Archive</a>
    <a href="#" class="nav-link text-white" onclick="loadAuditLogs()"><i class="bi bi-clock-history"></i> Audit Logs</a>
    <a href="#" class="nav-link text-white" onclick="loadDatabaseTools()"><i class="bi bi-database"></i> Database Tools</a>`;
  
  if (currentUser.role === 'Admin') {
    menu += `<a href="#" class="nav-link text-white" onclick="loadBackupRestore()"><i class="bi bi-shield-lock"></i> Backup & Restore</a>`;
    menu += `<hr class="text-white-50 my-2"><a href="#" class="nav-link text-white" onclick="loadSettings()"><i class="bi bi-gear"></i> Settings</a>`;
  }
  
  menu += `</div>`;
  sidebar.innerHTML = menu;
}

function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  showLogin();
}

window.logout = logout;