const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin, isStaff } = require('../middleware/roleCheck');
const { getSettings, updateSettings, updateThemeColor } = require('../controllers/setting.controller');

router.use(protect);

// ✅ Fixed: GET = All staff, PUT = Admin only
router.get('/', isStaff, getSettings);
router.put('/', isAdmin, updateSettings);
router.put('/theme', isAdmin, updateThemeColor);

module.exports = router;