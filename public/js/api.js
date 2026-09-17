const api = {
  request: async (method, url, data = null) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (data) options.body = JSON.stringify(data);

    try {
      const response = await fetch(`/api${url}`, options);
      const result = await response.json();

      // ✅ FIX: Skip 401 handling for login request
      if (response.status === 401 && !url.includes('/auth/login')) {
        localStorage.removeItem('token');
        showToast('Session expired. Please login again.', 'warning');
        setTimeout(() => window.location.reload(), 1500);
        throw new Error('Session expired');
      }

      if (!result.success) throw new Error(result.error || 'Request failed');
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  get: (url) => api.request('GET', url),
  post: (url, data) => api.request('POST', url, data),
  put: (url, data) => api.request('PUT', url, data),
  delete: (url) => api.request('DELETE', url)
};

// Toast Notification Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} shadow-sm`;
  toast.style.minWidth = '250px';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}