const { body } = require('express-validator');

exports.createResultValidation = [
  body('registration').notEmpty().withMessage('Registration ID is required'),
  body('student').notEmpty().withMessage('Student ID is required'),
  body('subjectMarks').isArray({ min: 1 }).withMessage('Subject marks are required'),
  body('percentage').isFloat({ min: 0, max: 100 }).withMessage('Invalid percentage')
];