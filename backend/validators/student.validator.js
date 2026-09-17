const { body } = require('express-validator');

exports.createStudentValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('fatherName').trim().notEmpty().withMessage('Father name is required'),
  body('class').trim().notEmpty().withMessage('Class is required')
];

exports.updateStudentValidation = [
  body('fullName').optional().trim().notEmpty(),
  body('fatherName').optional().trim().notEmpty(),
  body('class').optional().trim().notEmpty()
];