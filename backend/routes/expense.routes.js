const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAccountant, isAdmin } = require('../middleware/roleCheck');
const { createExpense, getExpenses, deleteExpense } = require('../controllers/expense.controller');
const { createExpenseValidation } = require('../validators/expense.validator');

router.use(protect);
router.post('/', isAccountant, createExpenseValidation, createExpense);
router.get('/', getExpenses);
router.delete('/:id', isAdmin, deleteExpense);

module.exports = router;