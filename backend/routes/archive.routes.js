const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const archiveController = require('../controllers/archive.controller');

router.use(protect);

// ✅ Fixed: All archive operations are Admin only
router.get('/', isAdmin, archiveController.getArchive);
router.post('/trash', isAdmin, archiveController.moveToTrash);
router.post('/restore/:id', isAdmin, archiveController.restoreFromArchive);
router.delete('/:id', isAdmin, archiveController.deleteFromArchive);

module.exports = router;