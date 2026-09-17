const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { getSettings, updateSettings } = require('../controllers/setting.controller');

router.use(protect);

router.get('/', getSettings);
router.put('/', isAdmin, updateSettings);

module.exports = router;