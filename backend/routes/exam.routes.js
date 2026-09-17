const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAcademicStaff, isAdmin } = require('../middleware/roleCheck');
const examController = require('../controllers/exam.controller');
const { createExamValidation, registerStudentValidation } = require('../validators/exam.validator');

router.use(protect);

router.get('/', examController.getExams);
router.post('/', isAdmin, createExamValidation, examController.createExam);
router.delete('/:id', isAdmin, examController.deleteExam);

router.get('/registrations', examController.getRegistrations);
router.post('/registrations', isAcademicStaff, registerStudentValidation, examController.registerStudent);
router.put('/registrations/:id', isAcademicStaff, examController.updateRegistration);
router.delete('/registrations/:id', isAdmin, examController.deleteRegistration);

module.exports = router;