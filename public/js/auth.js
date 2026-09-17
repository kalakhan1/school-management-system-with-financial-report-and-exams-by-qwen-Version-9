let currentUser = null;

// ✅ NEW: Role-based permissions configuration
const ROLE_PERMISSIONS = {
  Admin: ['all'], // Admin can access everything
  Accountant: [
    'dashboard', 
    'fees', 
    'expenses', 
    'salaries', 
    'financialReports', 
    'feeReminders'
  ],
  Clerk: [
    'dashboard', 
    'students', 
    'teachers', 
    'classes', 
    'attendance', 
    'exams', 
    'results', 
    'testResults', 
    'classResults', 
    'idCards'
  ]
};

// ✅ NEW: Check if user can access a feature
function canAccess(feature) {
  if (!currentUser) return false;
  const permissions = ROLE_PERMISSIONS[currentUser.role] || [];
  return permissions.includes('all') || permissions.includes(feature);
}

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
    <p class="text-muted small mb-2">Role: <span class="badge bg-info">${currentUser.role}</span></p>
    <hr>`;
  
  menu += `<div class="nav flex-column">`;
  
  // ✅ Dashboard (All roles)
  if (canAccess('dashboard')) {
    menu += `<a href="#" class="nav-link text-white" onclick="loadDashboard()"><i class="bi bi-speedometer2"></i> Dashboard</a>`;
  }
  
  // ✅ Users (Admin only)
  if (canAccess('all')) {
    menu += `<a href="#" class="nav-link text-white" onclick="loadUsers()"><i class="bi bi-people"></i> Users</a>`;
  }
  
  // ✅ Academic Section (Admin + Clerk)
  if (canAccess('students') || canAccess('teachers') || canAccess('classes') || canAccess('attendance')) {
    menu += `<hr class="text-white-50 my-2"><small class="text-white-50 px-2">ACADEMIC</small>`;
    
    if (canAccess('students')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadStudents()"><i class="bi bi-mortarboard"></i> Students</a>`;
    }
    if (canAccess('teachers')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadTeachers()"><i class="bi bi-person-video2"></i> Teachers</a>`;
    }
    if (canAccess('classes')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadClasses()"><i class="bi bi-building"></i> Classes</a>`;
    }
    if (canAccess('attendance')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadAttendance()"><i class="bi bi-calendar-check"></i> Attendance</a>`;
    }
  }
  
  // ✅ Finance Section (Admin + Accountant)
  if (canAccess('fees') || canAccess('expenses') || canAccess('salaries')) {
    menu += `<hr class="text-white-50 my-2"><small class="text-white-50 px-2">FINANCE</small>`;
    
    if (canAccess('fees')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadFees()"><i class="bi bi-cash-coin"></i> Fee Collection</a>`;
    }
    if (canAccess('expenses')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadExpenses()"><i class="bi bi-receipt"></i> Expenses</a>`;
    }
    if (canAccess('salaries')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadSalaries()"><i class="bi bi-wallet2"></i> Salaries</a>`;
    }
  }
  
  // ✅ Examination Section (Admin + Clerk)
  if (canAccess('exams') || canAccess('results') || canAccess('testResults')) {
    menu += `<hr class="text-white-50 my-2"><small class="text-white-50 px-2">EXAMINATION</small>`;
    
    if (canAccess('exams')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadExams()"><i class="bi bi-journal-bookmark"></i> Exams</a>`;
    }
    if (canAccess('results')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadResults()"><i class="bi bi-file-earmark-ruled"></i> Results</a>`;
    }
    if (canAccess('testResults')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadTestResults()"><i class="bi bi-clipboard-check"></i> Test Results</a>`;
    }
  }
  
  // ✅ Reports Section (Mixed)
  if (canAccess('classResults') || canAccess('financialReports') || canAccess('feeReminders') || canAccess('idCards')) {
    menu += `<hr class="text-white-50 my-2"><small class="text-white-50 px-2">REPORTS</small>`;
    
    if (canAccess('classResults')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadClassResultReport()"><i class="bi bi-file-earmark-ruled"></i> Class Results</a>`;
    }
    if (canAccess('financialReports')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadFinancialReports()"><i class="bi bi-graph-up"></i> Financial Reports</a>`;
    }
    if (canAccess('feeReminders')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadFeeReminders()"><i class="bi bi-bell"></i> Fee Reminders</a>`;
    }
    if (canAccess('idCards')) {
      menu += `<a href="#" class="nav-link text-white" onclick="loadIdCards()"><i class="bi bi-person-badge"></i> ID Cards</a>`;
    }
  }
  
  // ✅ Utilities Section (Admin only)
  if (canAccess('all')) {
    menu += `<hr class="text-white-50 my-2"><small class="text-white-50 px-2">UTILITIES</small>`;
    menu += `<a href="#" class="nav-link text-white" onclick="loadDataManager()"><i class="bi bi-table"></i> Data Manager</a>`;
    menu += `<a href="#" class="nav-link text-white" onclick="loadArchive()"><i class="bi bi-trash"></i> Trash / Archive</a>`;
    menu += `<a href="#" class="nav-link text-white" onclick="loadAuditLogs()"><i class="bi bi-clock-history"></i> Audit Logs</a>`;
    menu += `<a href="#" class="nav-link text-white" onclick="loadDatabaseTools()"><i class="bi bi-database"></i> Database Tools</a>`;
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