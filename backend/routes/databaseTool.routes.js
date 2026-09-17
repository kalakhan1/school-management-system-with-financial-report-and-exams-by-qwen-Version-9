const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { getDatabaseStats } = require('../controllers/databaseTool.controller');

router.use(protect);
router.get('/stats', isAdmin, getDatabaseStats);

module.exports = router;