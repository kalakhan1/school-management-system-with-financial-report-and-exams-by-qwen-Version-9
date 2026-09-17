const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/user.controller');

// ✅ FIX: Correct imports from respective validator files
const { registerValidation } = require('../validators/auth.validator');
const { updateUserValidation } = require('../validators/user.validator');

router.use(protect);

router.get('/', getUsers);
router.post('/', isAdmin, registerValidation, createUser);
router.put('/:id', isAdmin, updateUserValidation, updateUser);
router.delete('/:id', isAdmin, deleteUser);

module.exports = router;