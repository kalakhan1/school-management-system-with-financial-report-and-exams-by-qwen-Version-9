const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { getAuditLogs } = require('../controllers/audit.controller');

router.use(protect);
router.get('/', isAdmin, getAuditLogs);

module.exports = router;