const { body } = require('express-validator');

exports.paySalaryValidation = [
  body('teacher').notEmpty().withMessage('Teacher ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('month').trim().notEmpty().withMessage('Month is required')
];