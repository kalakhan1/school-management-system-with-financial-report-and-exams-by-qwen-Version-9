const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { getSettings, updateSettings, updateThemeColor } = require('../controllers/setting.controller');

router.use(protect);

router.get('/', getSettings);
router.put('/', isAdmin, updateSettings);
router.put('/theme', isAdmin, updateThemeColor); // ✅ NEW: Theme color endpoint

module.exports = router;