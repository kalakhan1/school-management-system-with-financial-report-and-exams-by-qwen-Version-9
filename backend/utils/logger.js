const AuditLog = require('../models/AuditLog');

const logError = async (error, context = '') => {
  console.error(`❌ ERROR [${context}]:`, error.message || error);
};

const logAudit = async (action, details = {}) => {
  try {
    await AuditLog.create({
      action,
      userId: details.userId || null,
      details: details,
      ipAddress: details.ipAddress || ''
    });
  } catch (error) {
    console.error('Failed to log audit:', error.message);
  }
};

module.exports = { logError, logAudit };