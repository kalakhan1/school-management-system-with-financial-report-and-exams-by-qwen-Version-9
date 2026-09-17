const { body } = require('express-validator');

exports.createTeacherValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('monthlyPackage').optional().isNumeric().withMessage('Package must be a number')
];

exports.updateTeacherValidation = [
  body('fullName').optional().trim().notEmpty(),
  body('monthlyPackage').optional().isNumeric()
];