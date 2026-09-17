const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboard.controller');

router.use(protect);
router.get('/stats', getDashboardStats);

module.exports = router;