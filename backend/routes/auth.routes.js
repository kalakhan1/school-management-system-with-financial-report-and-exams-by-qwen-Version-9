const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { login, getMe } = require('../controllers/auth.controller');
const { loginValidation } = require('../validators/auth.validator');

router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);

module.exports = router;