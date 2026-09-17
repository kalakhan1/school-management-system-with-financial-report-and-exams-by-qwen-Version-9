const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAccountant } = require('../middleware/roleCheck');
const { getOutstandingStudents } = require('../controllers/feeReminder.controller');

router.use(protect);
router.get('/outstanding', isAccountant, getOutstandingStudents);

module.exports = router;