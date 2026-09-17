const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAcademicStaff, isAdmin } = require('../middleware/roleCheck');
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/student.controller');
const { createStudentValidation, updateStudentValidation } = require('../validators/student.validator');

router.use(protect);

router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post('/', isAcademicStaff, createStudentValidation, createStudent);
router.put('/:id', isAcademicStaff, updateStudentValidation, updateStudent);
router.delete('/:id', isAdmin, deleteStudent);

module.exports = router;