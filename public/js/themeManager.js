// ==========================================
// THEME MANAGER - Dark/Light Mode
// ==========================================

const ThemeManager = {
  STORAGE_KEY: 'theme',
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark'
  },

  // Initialize theme on page load
  init() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Priority: Saved preference > System preference > Light (default)
    const theme = savedTheme || (systemPrefersDark ? this.THEMES.DARK : this.THEMES.LIGHT);
    
    this.applyTheme(theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.applyTheme(e.matches ? this.THEMES.DARK : this.THEMES.LIGHT);
        this.updateToggleButton();
      }
    });
  },

  // Apply theme to body
  applyTheme(theme) {
    if (theme === this.THEMES.DARK) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.updateToggleButton();
  },

  // Toggle between light and dark
  toggle() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;
    this.applyTheme(newTheme);
    
    // Show toast notification
    if (typeof showToast === 'function') {
      showToast(`${newTheme === this.THEMES.DARK ? '🌙' : '☀️'} ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`, 'info');
    }
  },

  // Get current theme
  getCurrentTheme() {
    return document.body.classList.contains('dark-mode') ? this.THEMES.DARK : this.THEMES.LIGHT;
  },

  // Update toggle button icon
  updateToggleButton() {
    const buttons = document.querySelectorAll('.theme-toggle-btn');
    const currentTheme = this.getCurrentTheme();
    
    buttons.forEach(btn => {
      const icon = btn.querySelector('i');
      const text = btn.querySelector('.theme-text');
      
      if (icon) {
        icon.className = currentTheme === this.THEMES.DARK ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
      }
      if (text) {
        text.textContent = currentTheme === this.THEMES.DARK ? 'Light' : 'Dark';
      }
    });
  }
};

// Initialize theme immediately (before DOM fully loads to prevent flash)
ThemeManager.init();

// Global function for toggle button
function toggleTheme() {
  ThemeManager.toggle();
}

// Export to window
window.ThemeManager = ThemeManager;
window.toggleTheme = toggleTheme;