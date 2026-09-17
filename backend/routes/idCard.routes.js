const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getStudentForIdCard } = require('../controllers/idCard.controller');

router.use(protect);
router.get('/student/:id', getStudentForIdCard);

module.exports = router;