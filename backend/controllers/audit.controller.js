const AuditLog = require('../models/AuditLog');

// @desc    Get Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { limit = 100, page = 1, action } = req.query;
    const filter = {};
    if (action) filter.action = action;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).populate('userId', 'username fullName').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true, data: logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
};