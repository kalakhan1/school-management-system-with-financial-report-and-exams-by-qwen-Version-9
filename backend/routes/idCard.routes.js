const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAcademicStaff } = require('../middleware/roleCheck');
const { getStudentForIdCard } = require('../controllers/idCard.controller');

router.use(protect);
router.get('/student/:id', isAcademicStaff, getStudentForIdCard); // ✅ Fixed: Only Admin + Clerk

module.exports = router;