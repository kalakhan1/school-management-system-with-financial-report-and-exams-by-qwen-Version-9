const { body, param, query } = require('express-validator');

exports.markAttendanceValidation = [
  body('type').isIn(['student', 'teacher']).withMessage('Invalid attendance type'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('records').isArray({ min: 1 }).withMessage('At least one attendance record is required'),
  body('records.*.status').isIn(['Present', 'Absent', 'Late', 'Leave']).withMessage('Invalid status'),
  body('records.*.remarks').optional().isString().isLength({ max: 200 })
];

exports.getAttendanceValidation = [
  query('type').optional().isIn(['student', 'teacher']),
  query('date').optional().isISO8601(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('className').optional().isString(),
  query('status').optional().isIn(['Present', 'Absent', 'Late', 'Leave'])
];