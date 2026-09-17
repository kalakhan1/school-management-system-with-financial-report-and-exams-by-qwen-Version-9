const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAcademicStaff, isAdmin } = require('../middleware/roleCheck');
const testResultController = require('../controllers/testResult.controller');

router.use(protect);

router.get('/', testResultController.getTestResults);
router.post('/', isAcademicStaff, testResultController.addTestResult);
router.delete('/:id', isAdmin, testResultController.deleteTestResult);

module.exports = router;