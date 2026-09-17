const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const archiveController = require('../controllers/archive.controller');

router.use(protect);

router.get('/', archiveController.getArchive);
router.post('/trash', archiveController.moveToTrash);
router.post('/restore/:id', archiveController.restoreFromArchive);
router.delete('/:id', isAdmin, archiveController.deleteFromArchive);

module.exports = router;