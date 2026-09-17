const { body } = require('express-validator');

exports.collectFeeValidation = [
  body('student').notEmpty().withMessage('Student ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('month').trim().notEmpty().withMessage('Month is required')
];