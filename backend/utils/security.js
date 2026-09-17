// Prevent NoSQL Injection (e.g., {"$gt": ""})
const sanitizeQuery = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  for (const key in obj) {
    if (key.startsWith('$')) continue; // Block operators like $gt, $ne
    sanitized[key] = typeof obj[key] === 'string' ? obj[key].trim() : obj[key];
  }
  return sanitized;
};

// Basic XSS Sanitization for strings
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

module.exports = { sanitizeQuery, sanitizeString };