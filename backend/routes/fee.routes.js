const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAccountant } = require('../middleware/roleCheck');
const { collectFee, getFeeHistory, getStudentFeeStatus } = require('../controllers/fee.controller');
const { collectFeeValidation } = require('../validators/fee.validator');

router.use(protect);
router.post('/collect', isAccountant, collectFeeValidation, collectFee);
router.get('/history', getFeeHistory);
router.get('/status', getStudentFeeStatus);

module.exports = router;