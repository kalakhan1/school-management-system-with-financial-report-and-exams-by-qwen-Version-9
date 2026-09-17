const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAccountant } = require('../middleware/roleCheck');
const { paySalary, getSalaryHistory } = require('../controllers/salary.controller');
const { paySalaryValidation } = require('../validators/salary.validator');

router.use(protect);
router.post('/pay', isAccountant, paySalaryValidation, paySalary);
router.get('/history', getSalaryHistory);

module.exports = router;