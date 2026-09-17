const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAcademicStaff } = require('../middleware/roleCheck');
const { getClassReport, getClassesWithResults } = require('../controllers/classResultReport.controller');

router.use(protect);

router.get('/report', isAcademicStaff, getClassReport);
router.get('/classes-with-results', isAcademicStaff, getClassesWithResults);

module.exports = router;