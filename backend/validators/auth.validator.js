const { body } = require('express-validator');

exports.loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

exports.registerValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format'),
  
  body('role')
    .optional()
    .isIn(['Admin', 'Accountant', 'Clerk']).withMessage('Invalid role')
];

exports.updateUserValidation = [
  body('fullName').optional().trim().notEmpty(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('role').optional().isIn(['Admin', 'Accountant', 'Clerk']),
  body('status').optional().isIn(['Active', 'Inactive'])
];