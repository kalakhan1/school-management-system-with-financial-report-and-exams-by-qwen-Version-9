const { body } = require('express-validator');

exports.createExpenseValidation = [
  body('category').isIn(['Utilities', 'Maintenance', 'Supplies', 'Transport', 'Miscellaneous']).withMessage('Invalid category'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
];