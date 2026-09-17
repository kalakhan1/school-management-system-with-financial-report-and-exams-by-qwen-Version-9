const { body } = require('express-validator');

exports.updateUserValidation = [
  body('fullName').optional().trim().notEmpty(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('role').optional().isIn(['Admin', 'Accountant', 'Clerk']),
  body('status').optional().isIn(['Active', 'Inactive'])
];