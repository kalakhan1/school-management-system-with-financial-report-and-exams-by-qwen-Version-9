const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAcademicStaff, isAdmin } = require('../middleware/roleCheck');
const { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacher.controller');
const { createTeacherValidation, updateTeacherValidation } = require('../validators/teacher.validator');

router.use(protect);

router.get('/', getTeachers);
router.get('/:id', getTeacherById);
router.post('/', isAcademicStaff, createTeacherValidation, createTeacher);
router.put('/:id', isAcademicStaff, updateTeacherValidation, updateTeacher);
router.delete('/:id', isAdmin, deleteTeacher);

module.exports = router;