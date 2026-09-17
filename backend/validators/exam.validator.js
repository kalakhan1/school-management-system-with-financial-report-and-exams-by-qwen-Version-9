const { body } = require('express-validator');

exports.createExamValidation = [
  body('examType').isIn(['Mid-Term', 'Annual', 'Term', 'Supplementary', 'Pre-Board']).withMessage('Invalid exam type'),
  body('examYear').isInt({ min: 2000, max: 2100 }).withMessage('Invalid year')
];

exports.registerStudentValidation = [
  body('student').notEmpty().withMessage('Student ID is required'),
  body('examType').notEmpty().withMessage('Exam type is required'),
  body('examYear').isInt().withMessage('Invalid year'),
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  body('subjects').isArray({ min: 1 }).withMessage('At least one subject is required')
];