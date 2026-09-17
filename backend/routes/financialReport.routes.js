const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin, isAccountant } = require('../middleware/roleCheck');
const { getFinancialSummary } = require('../controllers/financialReport.controller');

router.use(protect);
router.get('/summary', isAccountant, getFinancialSummary);

module.exports = router;