const { body } = require('express-validator');

exports.loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

exports.registerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('username').trim().notEmpty().isAlphanumeric().withMessage('Username must be alphanumeric'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['Admin', 'Accountant', 'Clerk']).withMessage('Invalid role')
];